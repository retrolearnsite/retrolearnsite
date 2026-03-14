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
    orange: 'border-crt-orange text-crt-orange bg-[rgba(232,98,42,0.12)]',
    yellow: 'border-crt-yellow text-crt-yellow bg-[rgba(240,192,64,0.12)]',
    teal: 'border-crt-teal text-crt-teal bg-[rgba(62,207,207,0.12)]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] border ${colorMap[color]} font-mono text-[11px] uppercase tracking-[0.06em]`} style={{ borderRadius: '2px' }}>
      <span className="blink-dot">{icon}</span>
      {label}
    </span>
  );
}

function StatCard({ number, label, trend, trendUp, accentColor }: {
  number: string; label: string; trend: string; trendUp: boolean;
  accentColor: 'orange' | 'yellow' | 'teal';
}) {
  const topBorderColor = { orange: 'var(--crt-orange)', yellow: 'var(--crt-yellow)', teal: 'var(--crt-teal)' };
  const numberColor = { orange: 'text-crt-orange', yellow: 'text-crt-yellow', teal: 'text-crt-teal' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border p-5 rounded-lg"
      style={{
        borderTop: `3px solid ${topBorderColor[accentColor]}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div className={`font-mono text-[32px] leading-none ${numberColor[accentColor]}`}>{number}</div>
      <div className="text-xs text-muted-foreground mt-1.5">{label}</div>
      <div className={`text-[11px] font-mono mt-3 ${trendUp ? 'text-crt-green' : 'text-crt-red'}`}>
        {trendUp ? '▲' : '▼'} {trend}
      </div>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, buttonLabel, onClick, accentColor = 'var(--crt-orange)' }: {
  icon: any; title: string; description: string; buttonLabel: string; onClick: () => void; accentColor?: string;
}) {
  return (
    <div
      className="group bg-card border border-border p-5 flex flex-col rounded-lg hover:border-[var(--border-accent)] transition-all duration-150 hover:-translate-y-0.5"
      style={{ borderTop: `3px solid ${accentColor}`, minHeight: '100px' }}
    >
      <div className="w-10 h-10 flex items-center justify-center mb-3 rounded-lg" style={{ background: `${accentColor}15` }}>
        <Icon className="w-6 h-6" style={{ color: accentColor }} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 flex-grow leading-relaxed">{description}</p>
      <Button
        variant="outline"
        onClick={onClick}
        className="w-full justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
        style={{ borderRadius: '4px' }}
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
    <div className="min-h-screen bg-background relative" style={{ padding: '28px 32px' }}>
      <div className="max-w-6xl mx-auto space-y-7">
        {/* Hero Section */}
        <header className="text-center relative crt-scanlines crt-glow rounded-lg" style={{ padding: '40px 0 32px' }}>
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-5">
              <StatusBadge icon="◼" label="AI-POWERED" color="orange" />
            </motion.div>

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

            <p className="text-[15px] text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your <span className="text-primary font-medium">AI-powered</span> learning platform with note transformation and collaborative study rooms
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ paddingLeft: '24px' }}>
          <StatCard number="1,337" label="Notes Transformed" trend="+12% this week" trendUp accentColor="orange" />
          <StatCard number="42,069" label="Flashcards Created" trend="+8% this week" trendUp accentColor="yellow" />
          <StatCard number="98.5%" label="Success Rate" trend="+2.1% this month" trendUp accentColor="teal" />
        </div>

        {/* Main Content */}
        {!user ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <User className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="font-display text-3xl text-foreground mb-3">SIGN IN REQUIRED</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Sign in to access all RetroLearn features and start your learning journey
            </p>
            <Button
              onClick={() => setShowAuthModal(true)}
              disabled={loading}
              className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-[0.06em] hover:bg-crt-yellow hover:text-background transition-all px-8"
              style={{ borderRadius: '4px' }}
            >
              <User className="w-4 h-4 mr-2" />
              ▶ SIGN IN TO CONTINUE
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Note Wizard - Hero Feature */}
            <div
              className="bg-card border border-border rounded-lg relative crt-scanlines"
              style={{ borderLeft: '4px solid var(--crt-orange)', padding: '24px 28px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-14 h-14 flex items-center justify-center bg-primary/10 text-primary flex-shrink-0 rounded-lg">
                  <Wand2 className="w-7 h-7" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h2 className="font-display text-[22px] text-foreground mb-1">Note Wizard</h2>
                  <p className="text-sm text-muted-foreground">Transform your messy notes into organized study materials with AI magic</p>
                </div>
                <Button
                  onClick={() => navigate('/note-wizard')}
                  className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-[0.06em] hover:bg-crt-yellow hover:text-background transition-all px-6 flex-shrink-0"
                  style={{ borderRadius: '4px' }}
                >
                  ▶ START TRANSFORMING
                </Button>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard icon={FileText} title="My Notes" description="Browse and manage your study materials" buttonLabel="VIEW NOTES" onClick={() => navigate('/notes')} accentColor="var(--crt-orange)" />
              <FeatureCard icon={Users} title="Work Rooms" description="Collaborate and study together" buttonLabel="JOIN ROOMS" onClick={() => navigate('/workrooms')} accentColor="var(--crt-teal)" />
              <FeatureCard icon={Trophy} title="Quizzes" description="Test your knowledge with AI" buttonLabel="START QUIZ" onClick={() => navigate('/quizzes')} accentColor="var(--crt-yellow)" />
              <FeatureCard icon={Search} title="Learn Anything" description="Discover any topic instantly" buttonLabel="EXPLORE" onClick={() => navigate('/learn')} accentColor="var(--crt-green)" />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center pt-7 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-[0.06em]">
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
