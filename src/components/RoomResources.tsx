import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pin, PinOff, Link2, FileText, Plus, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Resource {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  resource_type: 'note' | 'link' | 'message';
  is_pinned: boolean;
  user_id: string;
  created_at: string;
}

interface RoomResourcesProps {
  roomId: string;
  userId: string;
}

export default function RoomResources({ roomId, userId }: RoomResourcesProps) {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Create resource form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'note' | 'link'>('link');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchResources();
    subscribeToResources();
  }, [roomId]);

  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('room_resources')
      .select('*')
      .eq('room_id', roomId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResources(data as Resource[]);
    }
    setLoading(false);
  };

  const subscribeToResources = () => {
    const channel = supabase
      .channel(`room_resources_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_resources',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchResources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createResource = async () => {
    if (!title.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }

    if (type === 'link' && !url.trim()) {
      toast({ title: "Enter a URL", variant: "destructive" });
      return;
    }

    if (type === 'note' && !content.trim()) {
      toast({ title: "Enter content", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('room_resources').insert({
      room_id: roomId,
      user_id: userId,
      resource_type: type,
      title: title.trim(),
      content: type === 'note' ? content.trim() : null,
      url: type === 'link' ? url.trim() : null
    });

    if (error) {
      toast({ title: "Error creating resource", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resource added!" });
      setTitle('');
      setContent('');
      setUrl('');
      
      // Award XP
      await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 5 });
      await supabase.from('room_xp_activity').insert({
        room_id: roomId,
        user_id: userId,
        activity_type: 'resource_added',
        xp_earned: 5
      });
    }
    setCreating(false);
  };

  const togglePin = async (resourceId: string, currentlyPinned: boolean) => {
    const { error } = await supabase
      .from('room_resources')
      .update({ is_pinned: !currentlyPinned })
      .eq('id', resourceId);

    if (error) {
      toast({ title: "Error updating pin", description: error.message, variant: "destructive" });
    }
  };

  const deleteResource = async (resourceId: string) => {
    const { error } = await supabase
      .from('room_resources')
      .delete()
      .eq('id', resourceId)
      .eq('user_id', userId);

    if (error) {
      toast({ title: "Error deleting resource", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resource deleted" });
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-retro text-xl glow-text">
            <FileText className="w-5 h-5 inline mr-2" />
            Resources
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="font-retro">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] font-retro">
              <DialogHeader>
                <DialogTitle className="font-retro text-2xl glow-text">Add Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={type === 'link' ? 'default' : 'outline'}
                    onClick={() => setType('link')}
                    className="font-retro flex-1"
                  >
                    <Link2 className="w-4 h-4 mr-1" />
                    Link
                  </Button>
                  <Button
                    variant={type === 'note' ? 'default' : 'outline'}
                    onClick={() => setType('note')}
                    className="font-retro flex-1"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Note
                  </Button>
                </div>

                <div>
                  <Label className="font-retro">Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Resource title"
                    className="font-retro"
                  />
                </div>

                {type === 'link' && (
                  <div>
                    <Label className="font-retro">URL</Label>
                    <Input
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="font-retro"
                    />
                  </div>
                )}

                {type === 'note' && (
                  <div>
                    <Label className="font-retro">Content</Label>
                    <Textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Important information..."
                      className="font-retro min-h-[100px]"
                    />
                  </div>
                )}

                <Button
                  onClick={createResource}
                  disabled={creating}
                  className="w-full font-retro"
                >
                  {creating ? 'Adding...' : 'Add Resource (+5 XP)'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="font-retro text-sm text-muted-foreground text-center py-4">
            No resources yet. Add helpful links or notes for the group!
          </p>
        ) : (
          <div className="space-y-2">
            {resources.map(resource => (
              <div
                key={resource.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  resource.is_pinned
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-primary/20 bg-muted/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {resource.is_pinned && (
                        <Pin className="w-3 h-3 text-accent flex-shrink-0" />
                      )}
                      <h4 className="font-retro text-sm font-bold truncate">
                        {resource.title}
                      </h4>
                      <Badge variant="outline" className="font-retro text-xs flex-shrink-0">
                        {resource.resource_type === 'link' ? <Link2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                      </Badge>
                    </div>

                    {resource.resource_type === 'link' && resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-retro text-xs text-primary hover:underline truncate block"
                      >
                        {resource.url}
                      </a>
                    )}

                    {resource.resource_type === 'note' && resource.content && (
                      <p className="font-retro text-xs text-muted-foreground line-clamp-2 mt-1">
                        {resource.content}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePin(resource.id, resource.is_pinned)}
                      className="h-7 w-7 p-0"
                    >
                      {resource.is_pinned ? (
                        <PinOff className="w-3 h-3" />
                      ) : (
                        <Pin className="w-3 h-3" />
                      )}
                    </Button>
                    {resource.user_id === userId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteResource(resource.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
