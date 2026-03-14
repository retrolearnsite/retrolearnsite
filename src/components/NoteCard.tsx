import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Eye, Calendar, Sparkles, Trophy, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NoteCardProps {
  note: any;
  onViewNote: (note: any) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  notesType?: 'regular' | 'shared';
}

export function NoteCard({ note, onViewNote, onDelete, deletingId, notesType = 'regular' }: NoteCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'failed':
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      case 'failed':
      case 'error': return 'Failed';
      default: return status;
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-note', { body: { noteId: note.id } });
      if (error) throw error;
      if (data && data.success && data.summary) {
        setSummary(data.summary);
        toast({ title: 'AI Summary Generated!', description: 'Gemini AI created a 3-line summary' });
      } else {
        const { data: noteData } = await supabase.from('notes').select('original_content').eq('id', note.id).single();
        const content = noteData?.original_content || '';
        const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
        const fallbackSummary = sentences.slice(0, 3).map((s: string) => s.trim()).join('. ') + '.';
        setSummary(fallbackSummary || 'Unable to generate summary.');
        toast({ title: 'Basic Summary', description: 'AI unavailable, showing text preview' });
      }
    } catch (error: any) {
      try {
        const { data: noteData } = await supabase.from('notes').select('original_content').eq('id', note.id).single();
        const content = noteData?.original_content || '';
        const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
        const fallbackSummary = sentences.slice(0, 3).map((s: string) => s.trim()).join('. ') + '.';
        setSummary(fallbackSummary || 'Unable to generate summary.');
        toast({ title: 'Using Basic Summary', description: 'AI service unavailable', variant: 'destructive' });
      } catch {
        toast({ title: 'Summarization Failed', description: 'Could not generate summary', variant: 'destructive' });
      }
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast({ title: 'Session expired', description: 'Please sign in again to continue', variant: 'destructive' });
        await supabase.auth.signOut();
        return;
      }
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { title: `Quiz: ${note.title}`, description: `Quiz generated from note`, topic: note.original_content },
      });
      if (error) throw error;
      toast({ title: 'Quiz Created!', description: 'Your quiz has been generated. Redirecting...' });
      setTimeout(() => navigate('/quizzes'), 1500);
    } catch (error: any) {
      toast({ title: 'Quiz Generation Failed', description: error.message || 'Could not generate quiz', variant: 'destructive' });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
      <div
        className="bg-card border border-border rounded-lg hover:border-[var(--border-accent)] w-full h-auto p-0 overflow-hidden group transition-all duration-150 hover:-translate-y-0.5"
        style={{ borderTop: '3px solid var(--crt-orange)' }}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                {note.title}
              </h3>
              {notesType === 'shared' && (note as any).shared_from_profile && (
                <div className="text-xs text-crt-teal mt-1">
                  Shared by: {(note as any).shared_from_profile.full_name || (note as any).shared_from_profile.email}
                </div>
              )}
            </div>
            <Badge variant={getStatusColor(note.processing_status)} className="text-[10px] shrink-0">
              {getStatusText(note.processing_status)}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {note.original_content?.slice(0, 150)}{note.original_content?.length > 150 ? '...' : ''}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </div>
        </div>

        {summary && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pb-4">
            <div className="p-3 bg-primary/10 border-l-2 border-primary rounded">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-mono font-medium text-primary uppercase tracking-[0.06em]">AI Summary</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">{summary}</p>
            </div>
          </motion.div>
        )}

        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {note.processing_status === 'completed' && (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => onViewNote(note)} className="text-xs h-8 hover:bg-primary/10 hover:text-primary font-mono uppercase tracking-[0.06em]">
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSummarize} disabled={summarizing || !!summary} className="text-xs h-8 hover:bg-primary/10 hover:text-primary font-mono uppercase tracking-[0.06em]">
                  {summarizing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {summary ? 'Done' : 'Summarize'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGenerateQuiz} disabled={generatingQuiz} className="text-xs h-8 hover:bg-primary/10 hover:text-primary font-mono uppercase tracking-[0.06em]">
                  {generatingQuiz ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trophy className="w-3 h-3 mr-1" />}
                  Quiz
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)} disabled={deletingId === note.id} className="text-xs h-8 hover:bg-destructive/10 hover:text-destructive ml-auto font-mono uppercase tracking-[0.06em]">
              <Trash2 className="w-3 h-3 mr-1" />
              {deletingId === note.id ? '...' : 'Del'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
