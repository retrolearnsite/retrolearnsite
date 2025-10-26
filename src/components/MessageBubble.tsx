import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageBubbleProps {
  message: any;
  isOnline: boolean;
  isOwn?: boolean;
}

export function MessageBubble({ message, isOnline, isOwn = false }: MessageBubbleProps) {
  const userColors = [
    'from-primary/20 to-primary/5',
    'from-accent/20 to-accent/5',
    'from-secondary/20 to-secondary/5',
    'from-success/20 to-success/5',
  ];
  
  const colorIndex = message.user_id ? message.user_id.charCodeAt(0) % userColors.length : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Avatar className="w-9 h-9 border-2 border-primary/30 shadow-neon">
        <AvatarFallback className="font-retro text-xs bg-gradient-to-br from-primary/20 to-accent/20">
          {message.user_name?.[0]?.toUpperCase() || 
           message.profiles?.full_name?.[0]?.toUpperCase() || 
           message.profiles?.email?.[0]?.toUpperCase() || 
           '?'}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2">
          <span className="font-retro text-sm font-bold glow-text">
            {message.user_name || 
             message.profiles?.full_name || 
             message.profiles?.email?.split('@')[0] || 
             'Unknown'}
          </span>
          {isOnline && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-500 rounded-full shadow-green"
            />
          )}
          <span className="font-retro text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`
            px-4 py-3 rounded-2xl max-w-md
            bg-gradient-to-br ${userColors[colorIndex]}
            border border-border/50 backdrop-blur-sm
            shadow-lg hover:shadow-neon transition-all
            ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}
          `}
        >
          <p className="font-retro text-sm leading-relaxed break-words">
            {message.message}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
