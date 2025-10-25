import { useNotes } from "@/hooks/useNotes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { NoteCard } from "./NoteCard";

interface NotesListProps {
  onViewNote: (note: any) => void;
  notesType?: 'regular' | 'shared';
}

export function NotesList({ onViewNote, notesType = 'regular' }: NotesListProps) {
  const { notes, sharedNotes, loading, deleteNote } = useNotes();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayNotes = notesType === 'shared' ? sharedNotes : notes;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteNote(id);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary scanlines">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="font-retro glow-text">MY NOTES</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="font-retro text-muted-foreground animate-pulse">Loading notes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayNotes.length === 0) {
    const title = notesType === 'shared' ? 'SHARED NOTES' : 'MY NOTES';
    const description = notesType === 'shared' 
      ? 'Notes shared with you from work rooms will appear here'
      : 'Your transformed notes will appear here';
    const emptyMessage = notesType === 'shared'
      ? 'No shared notes yet'
      : 'No notes yet';
    const emptySubtext = notesType === 'shared'
      ? 'When someone shares notes in your work rooms, they\'ll appear here'
      : 'Go to Note Wizard or the home page to create your first note';

    return (
      <Card className="border-2 border-primary scanlines">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="font-retro glow-text">{title}</CardTitle>
          </div>
          <CardDescription className="font-retro">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <div className="font-retro text-muted-foreground mb-2">{emptyMessage}</div>
            <div className="text-sm font-retro text-muted-foreground">
              {emptySubtext}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = notesType === 'shared' ? 'SHARED NOTES' : 'MY NOTES';

  return (
    <Card className="border-2 border-primary scanlines">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="font-retro glow-text">{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="font-retro">
            {displayNotes.length} notes
          </Badge>
        </div>
        <CardDescription className="font-retro">
          {notesType === 'shared' 
            ? 'Notes shared with you from work rooms' 
            : 'Your transformed notes and study materials'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {displayNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onViewNote={onViewNote}
                onDelete={handleDelete}
                deletingId={deletingId}
                notesType={notesType}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}