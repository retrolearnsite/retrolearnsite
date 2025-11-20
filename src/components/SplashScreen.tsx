import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import retroLogo from '@/assets/vintage-tv-icon.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 4;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {progress < 100 ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-terminal scanlines"
        >
        <div className="text-center space-y-6 md:space-y-8 px-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 1 }}
            className="relative mx-auto w-24 h-24 md:w-32 md:h-32"
          >
            <img
              src={retroLogo}
              alt="Retro Learn"
              className="w-full h-full rounded-full shadow-neon"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl md:text-5xl font-retro font-bold glow-text mb-4">
              RETRO LEARN
            </h1>
            <div className="flex items-center justify-center gap-2 text-secondary font-retro">
              <Zap className="w-5 h-5 animate-pulse" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                BOOTING SYSTEM...
              </motion.span>
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.6 }}
            className="mx-auto max-w-xs px-4"
          >
            <div className="h-2 bg-card border border-primary rounded-full overflow-hidden shadow-neon">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-2 font-retro text-sm text-muted-foreground"
            >
              {progress}%
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
