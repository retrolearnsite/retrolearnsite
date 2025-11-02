import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MessageBubbleProps {
  message: any;
  isOnline: boolean;
  isOwn?: boolean;
}

interface Reaction {
  id: string;
  user_id: string;
  reaction_type: 'approve' | 'reject';
}

export function MessageBubble({ message, isOnline, isOwn = false }: MessageBubbleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<'approve' | 'reject' | null>(null);
  
  const isIdea = message.message_type === 'idea';
  
  const userColors = [
    'from-primary/20 to-primary/5',
    'from-accent/20 to-accent/5',
    'from-secondary/20 to-secondary/5',
    'from-success/20 to-success/5',
  ];
  
  const colorIndex = message.user_id ? message.user_id.charCodeAt(0) % userColors.length : 0;

  // Load reactions for ideas
  useEffect(() => {
    if (!isIdea) return;
    
    const fetchReactions = async () => {
      const { data, error } = await supabase
        .from('room_message_reactions')
        .select('*')
        .eq('message_id', message.id);
      
      if (!error && data) {
        const typedReactions = data.map(r => ({
          id: r.id,
          user_id: r.user_id,
          reaction_type: r.reaction_type as 'approve' | 'reject'
        }));
        setReactions(typedReactions);
        const myReaction = typedReactions.find(r => r.user_id === user?.id);
        setUserReaction(myReaction?.reaction_type || null);
      }
    };

    fetchReactions();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`message_reactions_${message.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_message_reactions',
        filter: `message_id=eq.${message.id}`
      }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isIdea, message.id, user?.id]);

  const handleReaction = async (reactionType: 'approve' | 'reject') => {
    if (!user) return;

    try {
      // If user already has this reaction, remove it
      if (userReaction === reactionType) {
        const { error } = await supabase
          .from('room_message_reactions')
          .delete()
          .eq('message_id', message.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setUserReaction(null);
      } else {
        // Delete existing reaction if any
        await supabase
          .from('room_message_reactions')
          .delete()
          .eq('message_id', message.id)
          .eq('user_id', user.id);

        // Add new reaction
        const { error } = await supabase
          .from('room_message_reactions')
          .insert({
            message_id: message.id,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (error) throw error;
        setUserReaction(reactionType);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive"
      });
    }
  };

  const approveCount = reactions.filter(r => r.reaction_type === 'approve').length;
  const rejectCount = reactions.filter(r => r.reaction_type === 'reject').length;
  
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
        
        <div className="space-y-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`
              px-4 py-3 rounded-2xl max-w-md
              ${isIdea 
                ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-primary/10 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                : `bg-gradient-to-br ${userColors[colorIndex]} border border-border/50`
              }
              backdrop-blur-sm
              shadow-lg hover:shadow-neon transition-all
              ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}
            `}
          >
            {isIdea && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-500/30">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <Badge className="font-retro text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
                  IDEA
                </Badge>
              </div>
            )}
            <p className="font-retro text-sm leading-relaxed break-words">
              {message.message}
            </p>
          </motion.div>

          {/* Reaction buttons for ideas */}
          {isIdea && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <Button
                size="sm"
                variant={userReaction === 'approve' ? 'default' : 'outline'}
                onClick={() => handleReaction('approve')}
                className={`font-retro text-xs h-7 ${
                  userReaction === 'approve' 
                    ? 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30' 
                    : 'border-green-500/50 text-green-500 hover:bg-green-500/10'
                }`}
              >
                <Check className="w-3 h-3 mr-1" />
                {approveCount > 0 && approveCount}
              </Button>
              <Button
                size="sm"
                variant={userReaction === 'reject' ? 'default' : 'outline'}
                onClick={() => handleReaction('reject')}
                className={`font-retro text-xs h-7 ${
                  userReaction === 'reject' 
                    ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
                    : 'border-red-500/50 text-red-500 hover:bg-red-500/10'
                }`}
              >
                <X className="w-3 h-3 mr-1" />
                {rejectCount > 0 && rejectCount}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
