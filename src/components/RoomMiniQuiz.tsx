import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Brain, Plus, Play, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface MiniQuiz {
  id: string;
  title: string;
  questions: Question[];
  creator_id: string;
  is_active: boolean;
}

interface RoomMiniQuizProps {
  roomId: string;
  userId: string;
}

export default function RoomMiniQuiz({ roomId, userId }: RoomMiniQuizProps) {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<MiniQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<MiniQuiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Create quiz state
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correct: 0 }
  ]);

  useEffect(() => {
    fetchQuizzes();
  }, [roomId]);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('room_mini_quizzes')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuizzes(data.map(q => ({
        ...q,
        questions: q.questions as unknown as Question[]
      })));
    }
  };

  const createQuiz = async () => {
    if (!newTitle.trim()) {
      toast({ title: "Enter a title", variant: "destructive" });
      return;
    }

    const validQuestions = newQuestions.filter(
      q => q.question.trim() && q.options.every(o => o.trim())
    );

    if (validQuestions.length === 0) {
      toast({ title: "Add at least one complete question", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { error } = await supabase.from('room_mini_quizzes').insert([{
      room_id: roomId,
      creator_id: userId,
      title: newTitle.trim(),
      questions: validQuestions as any
    }]);

    if (error) {
      toast({ title: "Error creating quiz", description: error.message, variant: "destructive" });
      setCreating(false);
    } else {
      toast({ title: "Quiz created!" });
      setNewTitle('');
      setNewQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
      setDialogOpen(false);
      fetchQuizzes();
      
      // Award XP
      await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 20 });
      await supabase.from('room_xp_activity').insert({
        room_id: roomId,
        user_id: userId,
        activity_type: 'quiz_created',
        xp_earned: 20
      });
      setCreating(false);
    }
  };

  const startQuiz = (quiz: MiniQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setAnswers([]);
    setShowResults(false);
  };

  const submitAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ < (activeQuiz?.questions.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;

    const calculatedScore = answers.reduce((acc, answer, i) => {
      return acc + (answer === activeQuiz.questions[i].correct ? 1 : 0);
    }, 0);

    setScore(calculatedScore);
    setShowResults(true);

    // Save attempt
    await supabase.from('room_quiz_attempts').insert({
      quiz_id: activeQuiz.id,
      room_id: roomId,
      user_id: userId,
      score: calculatedScore,
      answers: { answers }
    });

    // Award XP
    const xp = calculatedScore * 5;
    await supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });
    await supabase.from('room_xp_activity').insert({
      room_id: roomId,
      user_id: userId,
      activity_type: 'quiz_completed',
      xp_earned: xp
    });

    toast({ title: `Quiz completed! +${xp} XP` });
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setShowResults(false);
    setAnswers([]);
    setCurrentQ(0);
  };

  // Taking Quiz UI
  if (activeQuiz && !showResults) {
    const question = activeQuiz.questions[currentQ];
    return (
      <Card className="border-2 border-accent/50 bg-card/95 backdrop-blur-sm shadow-neon">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-retro text-xl glow-text">
              {activeQuiz.title}
            </CardTitle>
            <Badge className="font-retro">
              {currentQ + 1} / {activeQuiz.questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="font-retro text-base">{question.question}</p>
          </div>

          <RadioGroup value={answers[currentQ]?.toString()} onValueChange={v => submitAnswer(parseInt(v))}>
            {question.options.map((option, i) => (
              <div key={i} className="flex items-center space-x-2 p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all">
                <RadioGroupItem value={i.toString()} id={`q${currentQ}-opt${i}`} />
                <Label htmlFor={`q${currentQ}-opt${i}`} className="font-retro flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex gap-2">
            {currentQ === activeQuiz.questions.length - 1 ? (
              <Button
                onClick={nextQuestion}
                disabled={answers[currentQ] === undefined}
                className="w-full font-retro"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Finish Quiz
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={answers[currentQ] === undefined}
                className="w-full font-retro"
              >
                Next Question
              </Button>
            )}
            <Button onClick={closeQuiz} variant="outline" className="font-retro">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results UI
  if (showResults && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <Card className="border-2 border-accent/50 bg-card/95 backdrop-blur-sm shadow-neon">
        <CardHeader className="text-center">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${percentage >= 70 ? 'text-accent' : 'text-muted-foreground'}`} />
          <CardTitle className="font-retro text-3xl glow-text">
            {percentage >= 70 ? 'Great Job!' : 'Quiz Complete'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="font-retro text-5xl font-bold">{percentage}%</p>
            <p className="font-retro text-muted-foreground">
              {score} / {activeQuiz.questions.length} correct
            </p>
            <Badge className="font-retro">+{score * 5} XP earned</Badge>
          </div>

          <div className="space-y-2">
            {activeQuiz.questions.map((q, i) => {
              const correct = answers[i] === q.correct;
              return (
                <div key={i} className={`p-3 rounded-lg border-2 ${correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 font-retro text-sm">
                      <p className="font-bold mb-1">{q.question}</p>
                      {!correct && (
                        <p className="text-xs text-muted-foreground">
                          Correct: {q.options[q.correct]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={closeQuiz} className="w-full font-retro">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main Quiz List UI
  return (
    <Card className="border-2 border-accent/30 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-retro text-xl glow-text">
            <Brain className="w-5 h-5 inline mr-2" />
            MINI QUIZZES
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="font-retro" 
                onClick={() => {
                  setNewTitle('');
                  setNewQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                  setDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] font-retro max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-retro text-2xl glow-text">Create Mini Quiz</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-retro">Quiz Title</Label>
                  <Input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Quick Math Quiz"
                    className="font-retro"
                  />
                </div>

                {/* Questions */}
                <div className="space-y-3">
                  <Label className="font-retro">Questions</Label>
                  {newQuestions.map((q, idx) => (
                    <Card key={idx} className="p-4 border-2 border-primary/20 bg-muted/10">
                      <div className="space-y-3">
                        <div>
                          <Label className="font-retro text-xs">Question {idx + 1}</Label>
                          <Textarea
                            value={q.question}
                            onChange={e => {
                              const updated = [...newQuestions];
                              updated[idx].question = e.target.value;
                              setNewQuestions(updated);
                            }}
                            placeholder="Enter your question here..."
                            className="font-retro min-h-[60px] mt-1"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-retro text-xs">Answer Options</Label>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <RadioGroup
                                value={q.correct === optIdx ? 'correct' : 'wrong'}
                                onValueChange={(val) => {
                                  const updated = [...newQuestions];
                                  updated[idx].correct = val === 'correct' ? optIdx : q.correct;
                                  setNewQuestions(updated);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="correct" id={`q${idx}-opt${optIdx}`} />
                                  <Label htmlFor={`q${idx}-opt${optIdx}`} className="font-retro text-xs cursor-pointer">✓ Correct</Label>
                                </div>
                              </RadioGroup>
                              <Input
                                value={opt}
                                onChange={e => {
                                  const updated = [...newQuestions];
                                  updated[idx].options[optIdx] = e.target.value;
                                  setNewQuestions(updated);
                                }}
                                placeholder={`Option ${optIdx + 1}`}
                                className="font-retro flex-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewQuestions([...newQuestions, { question: '', options: ['', '', '', ''], correct: 0 }]);
                    }}
                    className="w-full font-retro"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Question
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createQuiz}
                    disabled={creating || !newTitle.trim() || newQuestions.some(q => !q.question.trim() || !q.options.every(o => o.trim()))}
                    className="flex-1 font-retro"
                  >
                    {creating ? 'Creating...' : 'Create Quiz (+20 XP)'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewTitle('');
                      setNewQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
                    }}
                    className="font-retro"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <p className="font-retro text-sm text-muted-foreground text-center py-4">
            No quizzes yet. Create one to test your knowledge!
          </p>
        ) : (
          <div className="space-y-2">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="p-3 rounded-lg border-2 border-primary/20 bg-muted/20 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-retro text-sm font-bold">{quiz.title}</h4>
                    <p className="font-retro text-xs text-muted-foreground">
                      {quiz.questions.length} questions • {quiz.questions.length * 5} XP
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startQuiz(quiz)}
                    className="font-retro"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
