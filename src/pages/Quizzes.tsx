import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Plus, 
  Play, 
  Trophy, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  ArrowLeft, 
  Zap, 
  Search, 
  Eye, 
  Lock, 
  Globe,
  ArrowRight
} from 'lucide-react';
import { ContinueGuideButton } from '@/components/ContinueGuideButton';

interface Quiz {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  created_at: string;
  is_public: boolean;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: string;
  question_number: number;
  created_at?: string;
}

interface QuizResult extends QuizQuestion {
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
}

interface QuizAttempt {
  id?: string;
  answers: Record<string, string>;
  score: number;
  total_questions: number;
  resultsData?: any[];
}

export default function Quizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(false);

  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createTopic, setCreateTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedQuiz, setNewlyCreatedQuiz] = useState<Quiz | null>(null);
  const [showQuizCreated, setShowQuizCreated] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const fetchQuizzes = async () => {
    if (!user) return;

    // Fetch all quizzes (public quizzes + user's private quizzes)
    const { data: allData, error } = await supabase
      .from('quizzes')
      .select('*')
      .or(`is_public.eq.true,creator_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching quizzes",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const quizzesWithProfiles = await Promise.all(
      (allData || []).map(async quiz => {
        if (quiz.creator_id === user.id) {
          return {
            ...quiz,
            profiles: {
              full_name: user.email?.split('@')[0] || 'You',
              email: user.email || ''
            }
          };
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', quiz.creator_id)
          .single();
        return { ...quiz, profiles: profile };
      })
    );
    setAllQuizzes(quizzesWithProfiles);
  };

  const createQuizWithAI = async () => {
    if (!createTitle.trim() || !createTopic.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and topic",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast({
          title: "Session expired",
          description: "Please sign in again to continue",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return;
      }

      const accessToken = sessionData.session.access_token;

      if (!user || !accessToken) {
        throw new Error("You must be signed in to create a quiz.");
      }

      const { data: result, error: fnError } = await supabase.functions.invoke('generate-quiz', {
        body: {
          title: createTitle,
          description: createDescription,
          topic: createTopic
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

      if (fnError) {
        if (fnError.message?.includes('session') || fnError.message?.includes('Authentication') || fnError.message?.includes('sign in')) {
          toast({
            title: "Session expired",
            description: "Please sign in again to continue",
            variant: "destructive"
          });
          await supabase.auth.signOut();
          return;
        }
        throw fnError;
      }

      const { quiz_id } = (result || {}) as { quiz_id: string };

      const { data: newQuiz } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quiz_id)
        .single();

      if (newQuiz) {
        setNewlyCreatedQuiz({
          ...newQuiz,
          profiles: {
            full_name: user.email?.split('@')[0] || 'You',
            email: user.email || ''
          }
        });
        setShowQuizCreated(true);
      }

      setCreateTitle('');
      setCreateDescription('');
      setCreateTopic('');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Error creating quiz",
        description: "Failed to generate quiz with AI",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_quiz_questions_for_attempt', { p_quiz_id: quiz.id });
      
      if (error) throw error;
      
      setCurrentQuiz(quiz);
      setQuestions((data || []) as QuizQuestion[]);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsCompleted(false);
      setResults(null);
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast({
        title: "Error loading quiz",
        description: "Failed to load quiz questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!currentQuiz || !user) return;

    try {
      const formattedAnswers: Record<string, string> = {};
      questions.forEach((question) => {
        const userAnswer = answers[question.id];
        formattedAnswers[`q_${question.question_number}`] = userAnswer || '';
      });

      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: currentQuiz.id,
          user_id: user.id,
          score: 0,
          total_questions: questions.length,
          answers: formattedAnswers
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      const { data: resultsData, error: resultsError } = await supabase
        .rpc('get_quiz_results_with_answers', { 
          p_quiz_id: currentQuiz.id,
          p_attempt_id: attemptData.id 
        });

      if (resultsError) throw resultsError;

      const score = (resultsData || []).filter((r: any) => r.is_correct).length;

      await supabase
        .from('quiz_attempts')
        .update({ score })
        .eq('id', attemptData.id);

      const attempt: QuizAttempt = {
        id: attemptData.id,
        answers,
        score,
        total_questions: questions.length,
        resultsData: resultsData || []
      };

      setResults(attempt);
      setIsCompleted(true);
      
      toast({
        title: "Quiz completed!",
        description: `You scored ${score} out of ${questions.length}`
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error submitting quiz",
        description: "Failed to save your results",
        variant: "destructive"
      });
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsCompleted(false);
    setResults(null);
    setNewlyCreatedQuiz(null);
    setShowQuizCreated(false);
  };

  const makeQuizPublic = async (quizId: string) => {
    const { error } = await supabase
      .from('quizzes')
      .update({ 
        is_public: true,
        just_created: false 
      })
      .eq('id', quizId);

    if (error) {
      toast({
        title: "Error making quiz public",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Quiz is now public!",
        description: "Other users can now find and take your quiz"
      });
      fetchQuizzes();
      setShowQuizCreated(false);
      setNewlyCreatedQuiz(null);
    }
  };

  const keepQuizPrivate = async (quizId: string) => {
    const { error } = await supabase
      .from('quizzes')
      .update({ 
        is_public: false,
        just_created: false 
      })
      .eq('id', quizId);

    if (error) {
      toast({
        title: "Error updating quiz",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Quiz kept private",
        description: "Your quiz is only visible to you"
      });
      fetchQuizzes();
      setShowQuizCreated(false);
      setNewlyCreatedQuiz(null);
    }
  };

  const filteredQuizzes = allQuizzes.filter(
    quiz => 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quiz Taking View
  if (currentQuiz && !isCompleted) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={resetQuiz} 
              className="font-retro glow-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              EXIT QUIZ
            </Button>
            <Badge variant="secondary" className="font-retro text-base px-4 py-2">
              {currentQuestionIndex + 1} / {questions.length}
            </Badge>
          </div>

          {/* Quiz Card */}
          <Card className="border-2 border-primary/50 bg-card/95 backdrop-blur-sm shadow-neon">
            <CardHeader className="space-y-4">
              <div className="text-center space-y-2">
                <CardTitle className="font-retro text-2xl md:text-3xl glow-text">
                  {currentQuiz.title}
                </CardTitle>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {currentQuestion && (
                <>
                  <div className="bg-muted/30 p-6 rounded-lg border border-border/50">
                    <h3 className="text-lg md:text-xl font-retro text-foreground leading-relaxed">
                      {currentQuestion.question_text}
                    </h3>
                  </div>

                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={value => selectAnswer(currentQuestion.id, value)}
                    className="space-y-3"
                  >
                    {['A', 'B', 'C', 'D'].map(option => (
                      <div
                        key={option}
                        className={`
                          flex items-start gap-4 p-5 rounded-lg border-2 
                          transition-all duration-300 cursor-pointer
                          ${answers[currentQuestion.id] === option
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <RadioGroupItem 
                          value={option} 
                          id={`${currentQuestion.id}-${option}`}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`${currentQuestion.id}-${option}`}
                          className="font-retro text-base flex-1 cursor-pointer leading-relaxed"
                        >
                          <span className="font-bold text-primary mr-3 text-lg">
                            {option}.
                          </span>
                          {currentQuestion[`option_${option.toLowerCase()}` as keyof QuizQuestion]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4 gap-4">
                    <Button
                      variant="outline"
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="font-retro"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={submitQuiz}
                        disabled={!answers[currentQuestion.id]}
                        className="font-retro bg-accent hover:bg-accent/90 shadow-lg"
                        size="lg"
                      >
                        <Trophy className="w-5 h-5 mr-2" />
                        SUBMIT QUIZ
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        disabled={!answers[currentQuestion.id]}
                        className="font-retro"
                        size="lg"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results View
  if (isCompleted && results) {
    const percentage = Math.round((results.score / results.total_questions) * 100);
    const isPerfect = percentage === 100;
    const isGood = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={resetQuiz} 
              className="font-retro glow-border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO QUIZZES
            </Button>
          </div>

          <Card className="border-2 border-accent/50 bg-card/95 backdrop-blur-sm shadow-neon">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="flex justify-center">
                <div className={`
                  p-6 rounded-full
                  ${isPerfect ? 'bg-success/20' : isGood ? 'bg-accent/20' : 'bg-destructive/20'}
                `}>
                  <Trophy className={`
                    w-20 h-20
                    ${isPerfect ? 'text-success' : isGood ? 'text-accent' : 'text-destructive'}
                  `} />
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="font-retro text-4xl md:text-5xl glow-text">
                  {isPerfect ? 'PERFECT!' : isGood ? 'GREAT JOB!' : 'QUIZ COMPLETE'}
                </CardTitle>
                <CardDescription className="font-retro text-lg text-muted-foreground">
                  {currentQuiz?.title}
                </CardDescription>
              </div>

              <div className="pt-4">
                <div className={`
                  text-7xl md:text-8xl font-retro font-bold mb-3
                  ${isPerfect ? 'glow-text' : isGood ? 'text-accent' : 'text-foreground'}
                `}>
                  {percentage}%
                </div>
                <div className="font-retro text-xl text-muted-foreground">
                  {results.score} out of {results.total_questions} correct
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-retro text-2xl glow-blue text-center">
                  Review Your Answers
                </h3>
                
                <ScrollArea className="h-[500px] rounded-lg border border-border/50 p-4">
                  <div className="space-y-4 pr-4">
                    {results?.resultsData?.map((resultItem: any, index: number) => {
                      const isCorrect = resultItem.is_correct;
                      const userAnswer = resultItem.user_answer;
                      const correctAnswer = resultItem.correct_answer;

                      const getUserAnswerText = () => {
                        if (!userAnswer || userAnswer === '') return "No answer selected";
                        return resultItem[`option_${userAnswer.toLowerCase()}`] || `Option ${userAnswer}`;
                      };

                      const getCorrectAnswerText = () => {
                        return resultItem[`option_${correctAnswer.toLowerCase()}`] || `Option ${correctAnswer}`;
                      };

                      return (
                        <div
                          key={resultItem.id}
                          className={`
                            p-5 rounded-lg border-2 transition-all
                            ${isCorrect 
                              ? 'border-success/30 bg-success/5' 
                              : 'border-destructive/30 bg-destructive/5'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {isCorrect ? (
                              <CheckCircle className="w-6 h-6 text-success mt-1 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
                            )}
                            
                            <div className="flex-1 space-y-3">
                              <div>
                                <Badge 
                                  variant="outline" 
                                  className="font-retro mb-2"
                                >
                                  Question {resultItem.question_number}
                                </Badge>
                                <p className="font-retro text-base leading-relaxed">
                                  {resultItem.question_text}
                                </p>
                              </div>

                              <div className="space-y-2 text-sm">
                                {!isCorrect && (
                                  <>
                                    <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                                      <p className="font-retro text-destructive font-semibold">
                                        Your answer: {userAnswer ? `${userAnswer}. ${getUserAnswerText()}` : "No answer selected"}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded bg-success/10 border border-success/20">
                                      <p className="font-retro text-success font-semibold">
                                        Correct answer: {correctAnswer}. {getCorrectAnswerText()}
                                      </p>
                                    </div>
                                  </>
                                )}
                                {isCorrect && (
                                  <div className="p-3 rounded bg-success/10 border border-success/20">
                                    <p className="font-retro text-success font-semibold">
                                      ✓ Correct! {userAnswer}. {getUserAnswerText()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Created Success Dialog
  if (showQuizCreated && newlyCreatedQuiz) {
    return (
      <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines flex items-center justify-center">
        <Card className="border-2 border-success/50 bg-card/95 backdrop-blur-sm shadow-neon max-w-2xl w-full animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-success/20">
                <Sparkles className="w-20 h-20 text-success" />
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="font-retro text-4xl glow-text">
                QUIZ CREATED!
              </CardTitle>
              <CardDescription className="font-retro text-xl">
                {newlyCreatedQuiz.title}
              </CardDescription>
            </div>

            <p className="font-retro text-muted-foreground pt-2">
              Your AI-generated quiz is ready! What would you like to do next?
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                onClick={() => startQuiz(newlyCreatedQuiz)}
                className="font-retro h-auto py-6 flex-col gap-2"
                variant="default"
                size="lg"
              >
                <Eye className="w-6 h-6" />
                <span>Preview & Test</span>
              </Button>

              <Button
                onClick={() => makeQuizPublic(newlyCreatedQuiz.id)}
                className="font-retro h-auto py-6 flex-col gap-2"
                variant="outline"
                size="lg"
              >
                <Globe className="w-6 h-6" />
                <span>Make Public</span>
              </Button>
            </div>

            <Button
              onClick={() => keepQuizPrivate(newlyCreatedQuiz.id)}
              className="w-full font-retro"
              variant="ghost"
            >
              <Lock className="w-4 h-4 mr-2" />
              Keep Private
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen bg-gradient-terminal p-3 sm:p-6 lg:p-8 scanlines">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <Link to="/">
            <Button 
              variant="outline" 
              size="sm" 
              className="font-retro glow-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-retro font-bold glow-text">
              RETRO QUIZZES
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-retro text-muted-foreground max-w-xl mx-auto px-4">
              Challenge yourself with AI-generated quizzes
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="do-quizzes" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1">
            <TabsTrigger value="do-quizzes" className="font-retro py-2.5 text-sm sm:text-base">
              <Play className="w-4 h-4 mr-1 sm:mr-2" />
              DO QUIZZES
            </TabsTrigger>
            <TabsTrigger value="create-quiz" className="font-retro py-2.5 text-sm sm:text-base">
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              CREATE QUIZ
            </TabsTrigger>
          </TabsList>

          {/* Do Quizzes Tab */}
          <TabsContent value="do-quizzes" className="mt-8 space-y-6">
            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search all quizzes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 font-retro h-14 text-lg bg-card/50 backdrop-blur-sm border-2 border-primary/30 focus:border-primary/60"
                />
              </div>
            </div>

            {/* Quizzes Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredQuizzes.map(quiz => {
                const isPublic = quiz.is_public;
                const isMine = quiz.creator_id === user?.id;
                
                return (
                  <Card
                    key={quiz.id}
                    className="group hover:scale-105 transition-all duration-300 border-2 border-primary/20 hover:border-primary/50 bg-card/90 backdrop-blur-sm hover:shadow-neon"
                  >
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={isPublic ? "default" : "secondary"} 
                          className="font-retro text-xs"
                        >
                          {isPublic ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                          {isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Badge>
                        {isMine && (
                          <Badge variant="outline" className="font-retro text-xs">
                            YOURS
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-retro text-lg glow-text line-clamp-2 leading-tight">
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <CardDescription className="font-retro text-xs line-clamp-2 min-h-[2.5rem]">
                        {quiz.description || 'No description'}
                      </CardDescription>

                      <div className="flex items-center justify-between text-xs font-retro text-muted-foreground pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 truncate flex-1">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {quiz.profiles?.full_name || quiz.profiles?.email?.split('@')[0] || 'Anonymous'}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => startQuiz(quiz)}
                        disabled={loading}
                        className="w-full font-retro h-9"
                        size="sm"
                      >
                        <Play className="w-3 h-3 mr-2" />
                        START
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty States */}
            {filteredQuizzes.length === 0 && searchTerm && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-retro text-xl glow-text mb-2">No Results</h3>
                <p className="font-retro text-muted-foreground text-sm">
                  Try different search terms
                </p>
              </div>
            )}

            {allQuizzes.length === 0 && !searchTerm && (
              <div className="text-center py-16">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-retro text-xl glow-text mb-2">No Quizzes Yet</h3>
                <p className="font-retro text-muted-foreground text-sm mb-6">
                  Create your first AI-powered quiz!
                </p>
                <Button
                  onClick={() => document.querySelector('[value="create-quiz"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}
                  className="font-retro"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Create Quiz Tab */}
          <TabsContent value="create-quiz" className="mt-8">
            <Card className="max-w-2xl mx-auto border-2 border-accent/50 bg-card/95 backdrop-blur-sm shadow-neon">
              <CardHeader className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-accent/20">
                    <Brain className="w-12 h-12 text-accent" />
                  </div>
                </div>
                <CardTitle className="font-retro text-2xl sm:text-3xl glow-text">
                  CREATE AI QUIZ
                </CardTitle>
                <CardDescription className="font-retro text-sm sm:text-base">
                  AI will generate questions on your chosen topic
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-retro text-sm">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., World History Quiz"
                    value={createTitle}
                    onChange={e => setCreateTitle(e.target.value)}
                    className="font-retro h-11 bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-retro text-sm">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description..."
                    value={createDescription}
                    onChange={e => setCreateDescription(e.target.value)}
                    className="font-retro min-h-[80px] bg-background/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic" className="font-retro text-sm">Topic / Subject</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Ancient Rome, World War II"
                    value={createTopic}
                    onChange={e => setCreateTopic(e.target.value)}
                    className="font-retro min-h-[100px] bg-background/50 resize-none"
                  />
                </div>

                <Button
                  onClick={createQuizWithAI}
                  disabled={creating || !createTitle.trim() || !createTopic.trim()}
                  className="w-full font-retro h-12 text-base shadow-lg"
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Zap className="w-5 h-5 mr-2 animate-pulse" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      GENERATE QUIZ
                    </>
                  )}
                </Button>

                <p className="text-xs font-retro text-muted-foreground text-center pt-2">
                  AI will create 10 multiple choice questions
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ContinueGuideButton />
      </div>
    </div>
  );
}
