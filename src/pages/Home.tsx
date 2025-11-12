import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import mascotImage from '@/assets/retro-wizard-mascot.jpg';
import { Sparkles, Brain, FileText, Users, Wand2, User, Zap, Trophy, Search, ArrowRight } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  return <div className="p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-8 relative">

          {/* Main Header */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-6 mb-6"
          >
            <div className="relative">
              <img src={mascotImage} alt="Retro Learn Mascot" className="w-24 h-24 rounded-full border-4 border-primary shadow-neon" />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-retro font-bold glow-text mb-2">
                RETRO LEARN
              </h1>
              <div className="flex items-center justify-center gap-4 text-lg font-retro text-secondary">
                <Brain className="w-5 h-5" />
                <span>LEARN</span>
                <Zap className="w-5 h-5 text-accent" />
                <span className="glow-pink">STUDY</span>
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="glow-blue">SUCCEED</span>
              </div>
            </div>
          </motion.div>
          
          <p className="text-lg font-retro text-muted-foreground max-w-2xl mx-auto">
            Your ultimate retro-styled learning platform with AI-powered note transformation and collaborative study rooms
          </p>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border-2 border-primary p-4 text-center">
            <div className="text-2xl font-retro font-bold glow-text">1,337</div>
            <div className="text-sm font-retro text-muted-foreground">Notes Transformed</div>
          </div>
          <div className="bg-card border-2 border-secondary p-4 text-center">
            <div className="text-2xl font-retro font-bold glow-blue">42,069</div>
            <div className="text-sm font-retro text-muted-foreground">Flashcards Created</div>
          </div>
          <div className="bg-card border-2 border-accent p-4 text-center">
            <div className="text-2xl font-retro font-bold glow-pink">98.5%</div>
            <div className="text-sm font-retro text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Feature Cards */}
        {!user ? (
          <div className="text-center py-16 bg-card border-2 border-primary rounded-xl animate-fade-in">
            <User className="w-20 h-20 mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-3xl font-retro font-bold glow-text mb-4">
              ACCESS REQUIRED
            </h2>
            <p className="font-retro text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Sign in to access all Retro Learn features and start your learning journey
            </p>
            <Button 
              variant="neon" 
              size="lg"
              onClick={() => setShowAuthModal(true)} 
              className="font-retro hover:scale-105 transition-transform" 
              disabled={loading}
            >
              <User className="w-5 h-5 mr-2" />
              SIGN IN TO CONTINUE
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Primary Features Row */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Note Wizard - Primary Feature */}
              <Card className="group hover:shadow-neon transition-all duration-500 border-2 border-primary bg-card rounded-xl hover:scale-[1.02] animate-fade-in lg:col-span-2">
                <CardHeader className="text-center pb-6">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
                    <Wand2 className="w-10 h-10 text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  </div>
                  <CardTitle className="font-retro text-2xl glow-text group-hover:glow-pink transition-all duration-300">
                    NOTE WIZARD
                  </CardTitle>
                  <CardDescription className="font-retro text-muted-foreground text-lg max-w-md mx-auto">
                    Transform your messy notes into organized study materials with AI magic
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/note-wizard')}
                    className="font-retro group-hover:bg-primary/20 transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                    START TRANSFORMING
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Features Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* My Notes */}
              <Card className="group hover:shadow-neon transition-all duration-500 border-2 border-secondary bg-card rounded-xl hover:scale-105 animate-fade-in">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-all duration-300">
                    <FileText className="w-8 h-8 text-secondary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  </div>
                  <CardTitle className="font-retro text-lg glow-text group-hover:glow-blue transition-all duration-300">
                    MY NOTES
                  </CardTitle>
                  <CardDescription className="font-retro text-muted-foreground text-sm">
                    Browse and manage your study materials
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/notes')}
                    className="font-retro group-hover:bg-secondary/20 transition-all duration-300 w-full text-sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    VIEW NOTES
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>

              {/* Work Rooms */}
              <Card className="group hover:shadow-neon transition-all duration-500 border-2 border-accent bg-card rounded-xl hover:scale-105 animate-fade-in">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300">
                    <Users className="w-8 h-8 text-accent group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  </div>
                  <CardTitle className="font-retro text-lg glow-text group-hover:glow-pink transition-all duration-300">
                    WORK ROOMS
                  </CardTitle>
                  <CardDescription className="font-retro text-muted-foreground text-sm">
                    Collaborate and study together
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/workrooms')}
                    className="font-retro group-hover:bg-accent/20 transition-all duration-300 w-full text-sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    JOIN ROOMS
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>

              {/* Quizzes */}
              <Card className="group hover:shadow-neon transition-all duration-500 border-2 border-warning bg-card rounded-xl hover:scale-105 animate-fade-in">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 group-hover:bg-warning/20 transition-all duration-300">
                    <Trophy className="w-8 h-8 text-warning group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  </div>
                  <CardTitle className="font-retro text-lg glow-text group-hover:glow-blue transition-all duration-300">
                    QUIZZES
                  </CardTitle>
                  <CardDescription className="font-retro text-muted-foreground text-sm">
                    Test your knowledge with AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/quizzes')}
                    className="font-retro group-hover:bg-warning/20 transition-all duration-300 w-full text-sm"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    START QUIZ
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>

              {/* Learn Anything */}
              <Card className="group hover:shadow-neon transition-all duration-500 border-2 border-destructive bg-card rounded-xl hover:scale-105 animate-fade-in">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-all duration-300">
                    <Search className="w-8 h-8 text-destructive group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                  </div>
                  <CardTitle className="font-retro text-lg glow-text group-hover:glow-pink transition-all duration-300">
                    LEARN ANYTHING
                  </CardTitle>
                  <CardDescription className="font-retro text-muted-foreground text-sm">
                    Discover any topic instantly
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/learn')}
                    className="font-retro group-hover:bg-destructive/20 transition-all duration-300 w-full text-sm"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    EXPLORE TOPICS
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-primary">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-retro text-sm text-muted-foreground">
              Powered by AI Magic & 80s Nostalgia
            </span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xs font-retro text-muted-foreground cursor-blink">
            Ready to make learning retroactively awesome
          </div>
        </footer>

        {/* Auth Modal */}
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </div>;
}