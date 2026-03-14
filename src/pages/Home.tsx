import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';
import retroLogo from '@/assets/vintage-tv-icon.png';
import { Sparkles, FileText, Users, User, Trophy, Search, ArrowRight, Wand2 } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';

function StatusBadge({ icon, label, color = 'orange' }: { icon: string; label: string; color?: 'orange' | 'yellow' | 'teal' }) {
  const colorMap = {
    orange: 'border-crt-orange text-crt-orange',
    yellow: 'border-crt-yellow text-crt-yellow',
    teal: 'border-crt-teal text-crt-teal',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border ${colorMap[color]} font-mono text-[11px] uppercase tracking-[0.08em]`} style={{ borderRadius: '2px' }}>
      <span className="blink-dot">{icon}</span>
      {label}
    </span>
  );
}

function StatCard({ number, label, trend, trendUp, accentColor }: {
  number: string; label: string; trend: string; trendUp: boolean;
  accentColor: 'orange' | 'yellow' | 'teal';
}) {
  const topBorderColor = { orange: '#e8622a', yellow: '#f0c040', teal: '#3ecfcf' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border/50 p-5 relative"
      style={{
        borderTop: `3px solid ${topBorderColor[accentColor]}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        borderRadius: '2px',
        borderColor: 'rgba(232,98,42,0.2)',
      }}
    >
      <div className="font-display text-[38px] leading-none text-foreground">{number}</div>
      <div className="text-sm text-muted-foreground mt-1 font-sans">{label}</div>
      <div className={`text-xs font-mono mt-3 ${trendUp ? 'text-crt-teal' : 'text-crt-red'}`}>
        {trendUp ? '▲' : '▼'} {trend}
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, buttonLabel, onClick, iconColor = 'text-primary' }: {
  icon: any; title: string; description: string; buttonLabel: string; onClick: () => void; iconColor?: string;
}) {
  return (
    <div className="group bg-card border border-border/50 p-5 flex flex-col h-full hover:border-primary/30 transition-all" style={{ borderRadius: '2px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className={`w-12 h-12 flex items-center justify-center mb-4 bg-primary/10 ${iconColor}`} style={{ borderRadius: '2px' }}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-grow">{description}</p>
      <Button
        variant="outline"
        onClick={onClick}
        className="w-full justify-center gap-2 font-mono text-xs uppercase tracking-[0.08em] border-primary/30 text-primary hover:bg-primary/10 transition-all"
        style={{ borderRadius: '3px' }}
      >
        {buttonLabel}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background relative">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <header className="text-center py-8 md:py-14 relative crt-scanlines crt-glow" style={{ borderRadius: '2px' }}>
          <div className="relative z-10">
            {/* Status Badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6">
              <StatusBadge icon="◼" label="AI-POWERED" color="orange" />
            </motion.div>

            {/* Logo + Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-4"
            >
              <img src={retroLogo} alt="RetroLearn Logo" className="w-16 h-16 md:w-20 md:h-20" />
              <h1 className="font-display text-4xl md:text-[52px] leading-none text-glow-orange">
                Retro <span className="text-primary">Learn</span>
              </h1>
            </motion.div>

            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-sans">
              Your <span className="text-primary font-medium">AI-powered</span> learning platform with note transformation and collaborative study rooms
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard number="1,337" label="Notes Transformed" trend="+12% this week" trendUp accentColor="orange" />
          <StatCard number="42,069" label="Flashcards Created" trend="+8% this week" trendUp accentColor="yellow" />
          <StatCard number="98.5%" label="Success Rate" trend="+2.1% this month" trendUp accentColor="teal" />
        </div>

        {/* Main Content */}
        {!user ? (
          <div className="text-center py-16 bg-card border border-border/50 relative" style={{ borderRadius: '2px' }}>
            <User className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="font-display text-3xl text-foreground mb-3">SIGN IN REQUIRED</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto font-sans">
              Sign in to access all RetroLearn features and start your learning journey
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              disabled={loading}
              className="bg-primary text-primary-foreground font-mono text-sm uppercase tracking-[0.08em] hover:bg-crt-yellow hover:text-background transition-all px-8"
              style={{ borderRadius: '3px' }}
            >
              <User className="w-4 h-4 mr-2" />
              ▶ SIGN IN TO CONTINUE
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Note Wizard - Hero Feature */}
            <div
              className="bg-card border border-border/50 p-6 md:p-8 relative crt-scanlines"
              style={{ borderLeft: '4px solid var(--crt-orange)', borderRadius: '2px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 flex items-center justify-center bg-primary/10 text-primary flex-shrink-0" style={{ borderRadius: '2px' }}>
                  <Wand2 className="w-8 h-8" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h2 className="font-display text-2xl text-foreground mb-1">Note Wizard</h2>
                  <p className="text-sm text-muted-foreground font-sans">Transform your messy notes into organized study materials with AI magic</p>
                </div>
                <Button
                  onClick={() => navigate('/note-wizard')}
                  className="bg-primary text-primary-foreground font-mono text-sm uppercase tracking-[0.08em] hover:bg-crt-yellow hover:text-background transition-all px-6 flex-shrink-0"
                  style={{ borderRadius: '3px' }}
                >
                  ▶ START TRANSFORMING
                </Button>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard icon={FileText} title="My Notes" description="Browse and manage your study materials" buttonLabel="VIEW NOTES" onClick={() => navigate('/notes')} />
              <FeatureCard icon={Users} title="Work Rooms" description="Collaborate and study together" buttonLabel="JOIN ROOMS" onClick={() => navigate('/workrooms')} iconColor="text-crt-teal" />
              <FeatureCard icon={Trophy} title="Quizzes" description="Test your knowledge with AI" buttonLabel="START QUIZ" onClick={() => navigate('/quizzes')} iconColor="text-crt-yellow" />
              <FeatureCard icon={Search} title="Learn Anything" description="Discover any topic instantly" buttonLabel="EXPLORE" onClick={() => navigate('/learn')} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-[0.08em]">
              Powered by AI Magic & 80s Nostalgia
            </span>
            <Sparkles className="w-4 h-4 text-crt-yellow" />
          </div>
          <div className="text-xs font-mono text-muted-foreground crt-loading">
            Ready to make learning retroactively awesome
          </div>
        </footer>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    </div>
  );
}
