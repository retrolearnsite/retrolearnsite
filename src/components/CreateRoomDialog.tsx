import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Lock, X } from 'lucide-react';
import { useWorkRooms } from '@/hooks/useWorkRooms';

interface CreateRoomDialogProps {
  onRoomCreated?: () => void;
}

const COMMON_TAGS = [
  'Math', 'Science', 'History', 'English', 'Physics', 'Chemistry',
  'Biology', 'Computer Science', 'Art', 'Music', 'Languages',
  'Business', 'Economics', 'Psychology', 'Philosophy'
];

export function CreateRoomDialog({ onRoomCreated }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createRoom } = useWorkRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    setIsCreating(true);
    const room = await createRoom(
      name.trim(), 
      description.trim() || undefined,
      isPublic,
      tags
    );
    
    if (room) {
      setOpen(false);
      setName('');
      setDescription('');
      setIsPublic(false);
      setTags([]);
      setCustomTag('');
      onRoomCreated?.();
    }
    
    setIsCreating(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setCustomTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setOpen(newOpen);
      if (!newOpen) {
        setName('');
        setDescription('');
        setIsPublic(false);
        setTags([]);
        setCustomTag('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 font-retro">
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] font-retro">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-retro text-2xl glow-text">Create Work Room</DialogTitle>
            <DialogDescription className="font-retro">
              Create a new work room to collaborate and share knowledge
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Room Name */}
            <div className="grid gap-2">
              <Label htmlFor="room-name" className="font-retro">Room Name *</Label>
              <Input
                id="room-name"
                placeholder="e.g., Advanced Physics Study Group"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isCreating}
                className="font-retro"
              />
            </div>
            
            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="room-description" className="font-retro">Description</Label>
              <Textarea
                id="room-description"
                placeholder="What will you study in this room?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCreating}
                rows={3}
                className="font-retro"
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary/30 bg-muted/20">
              <div className="space-y-1">
                <Label htmlFor="is-public" className="font-retro flex items-center gap-2">
                  {isPublic ? (
                    <>
                      <Globe className="w-4 h-4 text-accent" />
                      Public Room
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Private Room
                    </>
                  )}
                </Label>
                <p className="text-xs font-retro text-muted-foreground">
                  {isPublic 
                    ? 'Anyone can discover and join this room'
                    : 'Only people with the join code can access'
                  }
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isCreating}
              />
            </div>

            {/* Subject Tags (only for public rooms) */}
            {isPublic && (
              <div className="grid gap-2">
                <Label className="font-retro">Subject Tags (max 5)</Label>
                <div className="space-y-2">
                  {/* Selected Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="font-retro text-xs">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Common Tags */}
                  {tags.length < 5 && (
                    <div className="flex flex-wrap gap-1">
                      {COMMON_TAGS.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag)}
                          disabled={isCreating}
                          className="font-retro text-xs h-7"
                        >
                          #{tag}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Custom Tag Input */}
                  {tags.length < 5 && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom tag..."
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(customTag);
                          }
                        }}
                        disabled={isCreating}
                        className="font-retro flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag(customTag)}
                        disabled={isCreating || !customTag.trim()}
                        className="font-retro"
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
              className="font-retro"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !name.trim()}
              className="font-retro"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
