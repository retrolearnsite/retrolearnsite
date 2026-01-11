import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Trophy, Users, Brain, TrendingUp, Calendar, Sparkles, ArrowLeft, Clock, Target, Award, MessageSquare } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';
interface DashboardStats {
  totalNotes: number;
  totalQuizzes: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  totalWorkRooms: number;
  recentActivity: any[];
  studyStreak: number;
}
export default function Dashboard() {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);
  const fetchDashboardStats = async () => {
    if (!user) return;
    try {
      // Fetch all stats in parallel
      const [notesResult, quizzesResult, attemptsResult, roomsResult] = await Promise.all([supabase.from('notes').select('id, created_at').eq('user_id', user.id), supabase.from('quizzes').select('id, created_at').eq('creator_id', user.id), supabase.from('quiz_attempts').select('score, total_questions, completed_at').eq('user_id', user.id), supabase.from('room_members').select('room_id').eq('user_id', user.id)]);
      const totalAttempts = attemptsResult.data?.length || 0;
      const averageScore = totalAttempts > 0 ? Math.round((attemptsResult.data?.reduce((sum, a) => sum + a.score / a.total_questions * 100, 0) || 0) / totalAttempts) : 0;
      setStats({
        totalNotes: notesResult.data?.length || 0,
        totalQuizzes: quizzesResult.data?.length || 0,
        totalQuizAttempts: totalAttempts,
        averageQuizScore: averageScore,
        totalWorkRooms: roomsResult.data?.length || 0,
        recentActivity: [],
        studyStreak: calculateStreak(attemptsResult.data || [])
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };
  const calculateStreak = (attempts: any[]) => {
    // Simple streak calculation based on consecutive days
    if (!attempts.length) return 0;
    const dates = attempts.map(a => new Date(a.completed_at).toDateString()).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date().toDateString();
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  if (loading || loadingStats) {
    return <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto py-12 md:py-24 text-center text-muted-foreground animate-pulse">
          Loading dashboard...
        </div>
      </div>;
  }
  if (!user) {
    return null;
  }
  const statCards = [{
    icon: FileText,
    label: 'Total Notes',
    value: stats?.totalNotes || 0,
    color: 'text-primary',
    gradient: 'from-primary/20 to-primary/5'
  }, {
    icon: Trophy,
    label: 'Quizzes Created',
    value: stats?.totalQuizzes || 0,
    color: 'text-accent',
    gradient: 'from-accent/20 to-accent/5'
  }, {
    icon: Target,
    label: 'Quiz Attempts',
    value: stats?.totalQuizAttempts || 0,
    color: 'text-secondary',
    gradient: 'from-secondary/20 to-secondary/5'
  }, {
    icon: Users,
    label: 'Work Rooms',
    value: stats?.totalWorkRooms || 0,
    color: 'text-warning',
    gradient: 'from-warning/20 to-warning/5'
  }];
  return <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.header initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 md:py-6 gap-4">
          <div className="flex items-start sm:items-center gap-2 md:gap-4 flex-col sm:flex-row w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="font-retro self-start">
              <ArrowLeft className="w-4 h-4 mr-2" />
              HOME
            </Button>
            <div>
              <h1 className="text-2xl md:text-4xl font-elegant font-bold">
                Your <span className="text-primary">Dashboard</span>
              </h1>
              <p className="text-xs md:text-sm font-elegant text-muted-foreground">
                Track your <span className="text-chart-2">learning progress</span>
              </p>
            </div>
          </div>
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary animate-pulse" />
        </motion.header>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => <motion.div key={stat.label} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.1
        }}>
              <Card className={`border-2 hover:shadow-neon transition-all duration-300 hover:scale-105 bg-gradient-to-br ${stat.gradient}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <Badge variant="secondary" className="font-retro text-xs">
                      TOTAL
                    </Badge>
                  </div>
                  <div className="text-3xl font-elegant font-bold glow-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-elegant text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>)}
        </div>

        {/* Performance Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quiz Performance */}
          <motion.div initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.4
        }}>
            <Card className="border-2 border-accent hover:shadow-neon transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-elegant font-semibold glow-pink flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Quiz Performance
                </CardTitle>
                <CardDescription className="font-elegant">
                  Your average quiz score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-elegant font-bold glow-text mb-2">
                    {stats?.averageQuizScore || 0}%
                  </div>
                  <Progress value={stats?.averageQuizScore || 0} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-2xl font-retro font-bold text-primary">
                      {stats?.totalQuizAttempts || 0}
                    </div>
                    <div className="text-xs font-retro text-muted-foreground">
                      Attempts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-retro font-bold text-secondary">
                      {stats?.totalQuizzes || 0}
                    </div>
                    <div className="text-xs font-retro text-muted-foreground">
                      Created
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Streak */}
          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.5
        }}>
            <Card className="border-2 border-warning hover:shadow-neon transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-elegant font-semibold glow-blue flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Study Streak
                </CardTitle>
                <CardDescription className="font-elegant">
                  Keep the momentum going!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-elegant font-bold glow-pink mb-2">
                    {stats?.studyStreak || 0}
                    <span className="text-2xl ml-2">🔥</span>
                  </div>
                  <div className="font-elegant text-muted-foreground">
                    Days in a row
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-accent" />
                    <div className="text-xs font-retro text-muted-foreground">
                      Stay consistent
                    </div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-xs font-retro text-muted-foreground">
                      Keep learning
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6
      }}>
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="font-elegant font-semibold glow-text flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="font-retro h-auto py-4 flex-col gap-2 hover:bg-primary/20" onClick={() => navigate('/note-wizard')}>
                  <Sparkles className="w-6 h-6" />
                  <span>Create Note</span>
                </Button>
                <Button variant="outline" className="font-retro h-auto py-4 flex-col gap-2 hover:bg-secondary/20" onClick={() => navigate('/quizzes')}>
                  <Trophy className="w-6 h-6" />
                  <span>Take Quiz</span>
                </Button>
                <Button variant="outline" className="font-retro h-auto py-4 flex-col gap-2 hover:bg-accent/20" onClick={() => navigate('/workrooms')}>
                  <Users className="w-6 h-6" />
                  <span>Join Room</span>
                </Button>
                <Button variant="outline" className="font-retro h-auto py-4 flex-col gap-2 hover:bg-warning/20" onClick={() => navigate('/notes')}>
                  <FileText className="w-6 h-6" />
                  <span>View Notes</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Section */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7
      }}>
          <Card className="border-2 border-accent">
            <CardHeader>
              <CardTitle className="font-elegant font-semibold glow-pink flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Share Your Feedback
              </CardTitle>
              <CardDescription className="font-elegant">
                Help us improve RetroLearn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>;
}