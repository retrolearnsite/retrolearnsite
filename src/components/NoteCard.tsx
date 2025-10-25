import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
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
      // First, let's try to get the note content and create a simple summary
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select('original_content, title')
        .eq('id', note.id)
        .single();

      if (noteError) {
        throw new Error('Could not fetch note content');
      }

      // Create a simple client-side summary as fallback
      const content = noteData.original_content || '';
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const summary = sentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';

      if (summary.length < 20) {
        // If content is too short, try the Edge Function
        const { data, error } = await supabase.functions.invoke('summarize-note', {
          body: { noteId: note.id }
        });

        if (error) {
          console.error('Supabase function error:', error);
          // Use fallback summary
          setSummary(summary || 'Content too short to summarize meaningfully.');
          toast({
            title: 'Basic Summary Generated',
            description: 'Created a simple summary (AI service unavailable)',
          });
          return;
        }

        if (data && data.success) {
          setSummary(data.summary);
          toast({
            title: 'AI Summary Generated!',
            description: 'AI has created a 3-line summary of your note',
          });
        } else {
          setSummary(summary);
          toast({
            title: 'Basic Summary Generated',
            description: 'Created a simple summary (AI service unavailable)',
          });
        }
      } else {
        setSummary(summary);
        toast({
          title: 'Summary Generated!',
          description: 'Created a summary of your note',
        });
      }
    } catch (error: any) {
      console.error('Error summarizing note:', error);
      toast({
        title: 'Summarization Failed',
        description: 'Could not generate summary. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast({
          title: 'Session expired',
          description: 'Please sign in again to continue',
          variant: 'destructive'
        });
        await supabase.auth.signOut();
        return;
      }

      const accessToken = sessionData.session.access_token;

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          title: `Quiz: ${note.title}`,
          description: `Quiz generated from note`,
          topic: note.original_content
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (error) throw error;

      toast({
        title: 'Quiz Created!',
        description: 'Your quiz has been generated. Redirecting...',
      });

      setTimeout(() => {
        navigate('/quizzes');
      }, 1500);
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Quiz Generation Failed',
        description: error.message || 'Could not generate quiz',
        variant: 'destructive',
      });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border border-secondary hover:border-primary transition-all duration-300 hover:shadow-neon">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-retro font-semibold truncate">{note.title}</h3>
                <Badge variant={getStatusColor(note.processing_status)} className="text-xs font-retro">
                  {getStatusText(note.processing_status)}
                </Badge>
              </div>
              
              {notesType === 'shared' && (note as any).shared_from_profile && (
                <div className="text-xs text-accent font-retro">
                  Shared by: {(note as any).shared_from_profile.full_name || (note as any).shared_from_profile.email}
                </div>
              )}
              
              <p className="text-sm text-muted-foreground font-retro line-clamp-2">
                {note.original_content?.slice(0, 120)}
                {note.original_content?.length > 120 ? '...' : ''}
              </p>
              
              {summary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-primary/10 border border-primary rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-retro font-bold text-primary">AI SUMMARY</span>
                  </div>
                  <p className="text-xs font-retro text-foreground">{summary}</p>
                </motion.div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-retro">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {note.processing_status === 'completed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewNote(note)}
                  className="font-retro text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  VIEW
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={summarizing || !!summary}
                  className="font-retro text-xs"
                >
                  {summarizing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  {summary ? 'SUMMARIZED' : 'SUMMARIZE'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="font-retro text-xs"
                >
                  {generatingQuiz ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Trophy className="w-3 h-3 mr-1" />
                  )}
                  MAKE QUIZ
                </Button>
              </>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(note.id)}
              disabled={deletingId === note.id}
              className="font-retro text-xs ml-auto"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {deletingId === note.id ? 'DEL...' : 'DEL'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
