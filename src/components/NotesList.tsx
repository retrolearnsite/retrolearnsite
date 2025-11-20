import { useNotes } from "@/hooks/useNotes";
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
      <div className="w-full">
        <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-6 scanlines">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="font-retro text-xl glow-text">My Notes</h2>
          </div>
          <div className="text-center py-12">
            <div className="font-retro text-muted-foreground animate-pulse">Loading notes...</div>
          </div>
        </div>
      </div>
    );
  }

  if (displayNotes.length === 0) {
    const title = notesType === 'shared' ? 'Shared Notes' : 'My Notes';
    const description = notesType === 'shared' 
      ? 'Notes shared with you from work rooms'
      : 'Your transformed notes and study materials';
    const emptyMessage = notesType === 'shared'
      ? 'No shared notes yet'
      : 'No notes yet';
    const emptySubtext = notesType === 'shared'
      ? 'When someone shares notes in your work rooms, they\'ll appear here'
      : 'Go to Note Wizard or the home page to create your first note';

    return (
      <div className="w-full">
        <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/50 rounded-lg p-6 scanlines">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="font-retro text-xl glow-text">{title}</h2>
            </div>
          </div>
          <p className="text-sm font-retro text-muted-foreground mb-6">{description}</p>
          
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <div className="font-retro text-muted-foreground mb-2 text-lg">{emptyMessage}</div>
            <div className="text-sm font-retro text-muted-foreground/70">
              {emptySubtext}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = notesType === 'shared' ? 'Shared Notes' : 'My Notes';
  const description = notesType === 'shared' 
    ? 'Notes shared with you from work rooms' 
    : 'Your transformed notes and study materials';

  return (
    <div className="w-full">
      <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/50 rounded-lg scanlines overflow-hidden">
        <div className="p-6 border-b border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="font-retro text-xl glow-text">{title}</h2>
            </div>
            <Badge variant="secondary" className="font-retro text-sm px-3 py-1">
              {displayNotes.length} notes
            </Badge>
          </div>
          <p className="text-sm font-retro text-muted-foreground">{description}</p>
        </div>
        
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
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
      </div>
    </div>
  );
}