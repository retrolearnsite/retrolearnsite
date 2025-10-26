import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, User, Calendar, Eye, Pin, PinOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SharedNote {
  id: string;
  title: string;
  summary: string | null;
  original_content: string;
  key_points: string[] | null;
  shared_from_user_id: string;
  created_at: string;
  shared_from_profile?: {
    full_name: string;
    email: string;
  };
}

interface SharedNoteWallProps {
  roomId: string;
  userId: string;
}

export default function SharedNoteWall({ roomId, userId }: SharedNoteWallProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedNotes();
    subscribeToNewNotes();
  }, [roomId]);

  const fetchSharedNotes = async () => {
    setLoading(true);
    
    const { data: sharedNoteRecords } = await supabase
      .from('room_shared_notes')
      .select('note_id')
      .eq('room_id', roomId)
      .order('shared_at', { ascending: false });

    if (!sharedNoteRecords || sharedNoteRecords.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const noteIds = sharedNoteRecords.map(r => r.note_id);
    
    const { data: notesData, error } = await supabase
      .from('notes')
      .select(`
        id,
        title,
        summary,
        original_content,
        key_points,
        shared_from_user_id,
        created_at
      `)
      .in('id', noteIds);

    if (error) {
      console.error('Error fetching shared notes:', error);
    } else {
      // Get profiles for shared notes
      const userIds = [...new Set(notesData?.map(n => n.shared_from_user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const notesWithProfiles = notesData?.map(note => ({
        ...note,
        shared_from_profile: profiles?.find(p => p.id === note.shared_from_user_id)
      })) || [];

      setNotes(notesWithProfiles as SharedNote[]);
    }
    
    setLoading(false);
  };

  const subscribeToNewNotes = () => {
    const channel = supabase
      .channel(`shared_notes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_shared_notes',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchSharedNotes();
          toast({ title: "New note shared!" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-retro text-xl glow-text">
            <FileText className="w-5 h-5 inline mr-2" />
            SHARED NOTES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-retro text-sm text-muted-foreground text-center py-4">
            Loading notes...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-retro text-xl glow-text">
            <FileText className="w-5 h-5 inline mr-2" />
            SHARED NOTES ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="font-retro text-sm text-muted-foreground text-center py-4">
              No notes shared yet. Share notes from your Notes page!
            </p>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border-2 border-primary/20 bg-muted/20 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-retro text-sm font-bold line-clamp-1">
                          {note.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNote(note);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>

                      {note.summary && (
                        <p className="font-retro text-xs text-muted-foreground line-clamp-2">
                          {note.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs font-retro text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">
                            {note.shared_from_profile?.full_name || 
                             note.shared_from_profile?.email?.split('@')[0] || 
                             'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Note Detail Dialog */}
      <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
        <DialogContent className="sm:max-w-[600px] font-retro">
          <DialogHeader>
            <DialogTitle className="font-retro text-2xl glow-text">
              {selectedNote?.title}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4 pr-4">
              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-retro">
                  <User className="w-3 h-3 mr-1" />
                  {selectedNote?.shared_from_profile?.full_name || 
                   selectedNote?.shared_from_profile?.email?.split('@')[0] || 
                   'Unknown'}
                </Badge>
                <span>
                  {selectedNote && new Date(selectedNote.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Summary */}
              {selectedNote?.summary && (
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <h4 className="font-retro text-sm font-bold mb-2 glow-blue">Summary</h4>
                  <p className="font-retro text-sm leading-relaxed">
                    {selectedNote.summary}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {selectedNote?.key_points && selectedNote.key_points.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-retro text-sm font-bold glow-blue">Key Points</h4>
                  <ul className="space-y-1">
                    {selectedNote.key_points.map((point, i) => (
                      <li key={i} className="font-retro text-sm flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Original Content */}
              <div className="space-y-2">
                <h4 className="font-retro text-sm font-bold glow-blue">Full Content</h4>
                <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                  <p className="font-retro text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNote?.original_content}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
