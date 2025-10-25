import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function RoomLoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-terminal scanlines"
    >
      <div className="text-center space-y-6">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 mx-auto relative"
        >
          <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-accent animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-primary" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-retro font-bold glow-text mb-2">
            🔮 Loading Work Room...
          </h2>
          <p className="font-retro text-sm text-muted-foreground">
            Preparing your collaborative space
          </p>
        </motion.div>

        <motion.div
          className="flex gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
