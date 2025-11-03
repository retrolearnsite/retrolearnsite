import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Laugh, PartyPopper, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const REACTIONS = [
  { type: 'thumbs_up', icon: ThumbsUp, label: 'Like', emoji: '👍', color: 'text-blue-500', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500' },
  { type: 'heart', icon: Heart, label: 'Love', emoji: '❤️', color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
  { type: 'laugh', icon: Laugh, label: 'Funny', emoji: '😂', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrate', emoji: '🎉', color: 'text-purple-500', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500' },
  { type: 'eye', icon: Eye, label: 'Seen', emoji: '👀', color: 'text-cyan-500', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500' },
];

interface ReactionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReaction: (reactionType: string, emoji: string) => void;
}

export function ReactionPicker({ open, onOpenChange, onSelectReaction }: ReactionPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-retro text-xl glow-text">Choose a Reaction</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-4">
          {REACTIONS.map(({ type, icon: Icon, label, emoji, color, bgColor, borderColor }) => (
            <motion.div
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                onClick={() => {
                  onSelectReaction(type, emoji);
                  onOpenChange(false);
                }}
                className={`
                  w-full h-24 flex flex-col items-center justify-center gap-2
                  font-retro border-2 ${borderColor}/50 hover:${bgColor} hover:${borderColor}
                  transition-all
                `}
              >
                <Icon className={`w-8 h-8 ${color}`} />
                <span className="text-xs">{label}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
