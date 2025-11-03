import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, Lightbulb, Download, FileIcon, ThumbsUp, Heart, Laugh, PartyPopper, Eye } from 'lucide-react';
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
  reaction_type: string;
}

const REACTION_TYPES = [
  { type: 'thumbs_up', icon: ThumbsUp, label: 'Like', color: 'text-blue-500', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500' },
  { type: 'heart', icon: Heart, label: 'Love', color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
  { type: 'laugh', icon: Laugh, label: 'Funny', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500' },
  { type: 'celebrate', icon: PartyPopper, label: 'Celebrate', color: 'text-purple-500', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500' },
  { type: 'eye', icon: Eye, label: 'Seen', color: 'text-cyan-500', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500' },
] as const;

const IDEA_REACTIONS = [
  { type: 'approve', icon: Check, label: 'Approve', color: 'text-green-500', bgColor: 'bg-green-500/20', borderColor: 'border-green-500' },
  { type: 'reject', icon: X, label: 'Reject', color: 'text-red-500', bgColor: 'bg-red-500/20', borderColor: 'border-red-500' },
] as const;

export function MessageBubble({ message, isOnline, isOwn = false }: MessageBubbleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  
  const isIdea = message.message_type === 'idea';
  const isFile = message.message_type === 'file';
  
  const userColors = [
    'from-primary/20 to-primary/5',
    'from-accent/20 to-accent/5',
    'from-secondary/20 to-secondary/5',
    'from-success/20 to-success/5',
  ];
  
  const colorIndex = message.user_id ? message.user_id.charCodeAt(0) % userColors.length : 0;

  // Build a URL that forces download via Supabase (?download=<filename>)
  const buildDownloadUrl = (url?: string, filename?: string) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (!u.searchParams.has('download')) {
        u.searchParams.set('download', filename || '1');
      }
      return u.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}download=${encodeURIComponent(filename || '1')}`;
    }
  };

  // Load reactions for all messages
  useEffect(() => {
    
    const fetchReactions = async () => {
      const { data, error } = await supabase
        .from('room_message_reactions')
        .select('*')
        .eq('message_id', message.id);
      
      if (!error && data) {
        const typedReactions = data.map(r => ({
          id: r.id,
          user_id: r.user_id,
          reaction_type: r.reaction_type
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
  }, [message.id, user?.id]);

  const handleReaction = async (reactionType: string) => {
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

  const getReactionCount = (type: string) => reactions.filter(r => r.reaction_type === type).length;
  const reactionButtons = isIdea ? IDEA_REACTIONS : REACTION_TYPES;
  
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
                : isFile
                ? 'bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-primary/10 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
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
              {isFile ? (
                <a 
                  href={buildDownloadUrl(message.file_url || message.message, message.file_name)} 
                  rel="noopener"
                  download={message.file_name || true}
                  className="flex items-center gap-3 group"
                >
                  <FileIcon className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-retro text-sm font-semibold group-hover:text-blue-400 transition-colors">
                      {message.file_name || 'Download File'}
                    </p>
                    <p className="font-retro text-xs text-muted-foreground">Click to download</p>
                  </div>
                  <Download className="w-5 h-5 text-blue-500 group-hover:translate-y-0.5 transition-transform" />
                </a>
              ) : (
              <p className="font-retro text-sm leading-relaxed break-words">
                {message.message}
              </p>
            )}
          </motion.div>

          {/* Display reaction counts if any */}
          {reactions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {[...REACTION_TYPES, ...IDEA_REACTIONS].map(({ type, icon: Icon, color }) => {
                const count = getReactionCount(type);
                if (count === 0) return null;
                
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={`font-retro text-xs px-2 py-0.5 ${color} border-current`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {count}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
