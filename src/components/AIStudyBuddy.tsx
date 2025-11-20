import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, Sparkles, BookOpen, MessageCircle, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIStudyBuddyProps {
  roomId: string;
  userId: string;
  roomMessages?: any[];
  sharedNotes?: any[];
  selectedMessage?: string;
  onClearSelectedMessage?: () => void;
  onSelectFromChat?: () => void;
}

export default function AIStudyBuddy({ 
  roomId, 
  userId, 
  roomMessages = [], 
  sharedNotes = [],
  selectedMessage = '',
  onClearSelectedMessage,
  onSelectFromChat
}: AIStudyBuddyProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [contextType, setContextType] = useState<'summary' | 'question' | 'explanation'>('question');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Update message when selectedMessage prop changes
  useEffect(() => {
    if (selectedMessage) {
      setMessage(selectedMessage);
    }
  }, [selectedMessage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const messageText = e.dataTransfer.getData('text/plain');
    if (messageText) {
      setMessage(messageText);
      toast({
        title: "Message added",
        description: "You can now ask the AI about this message",
      });
    }
  };

  const askAI = async () => {
    if (!message.trim()) {
      toast({
        title: "Enter a question",
        description: "Please type your question or request",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-study-buddy', {
        body: {
          message: message.trim(),
          contextType,
          roomMessages: contextType === 'summary' ? roomMessages : [],
          sharedNotes
        }
      });

      if (error) throw error;

      const aiResponse = data.response;
      setResponse(aiResponse);

      // Save to database
      await supabase.from('ai_study_buddy_chats').insert({
        room_id: roomId,
        user_id: userId,
        message: message.trim(),
        response: aiResponse,
        context_type: contextType
      });

      // Award XP for using AI study buddy
      await supabase.rpc('award_xp', { p_user_id: userId, p_xp: 5 });
      await supabase.from('room_xp_activity').insert({
        room_id: roomId,
        user_id: userId,
        activity_type: 'ai_interaction',
        xp_earned: 5
      });

      toast({
        title: "AI Study Buddy responded!",
        description: "+5 XP earned"
      });

    } catch (error: any) {
      console.error('Error asking AI:', error);
      
      // Check if it's a function error with a response
      let errorMessage = "Failed to get AI response";
      
      if (error?.context?.body) {
        try {
          const errorBody = JSON.parse(error.context.body);
          errorMessage = errorBody.error || errorMessage;
        } catch {
          // If parsing fails, use default message
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      className={`border-2 backdrop-blur-sm shadow-neon transition-all ${
        isDragOver 
          ? 'border-primary bg-primary/10 scale-[1.02]' 
          : 'border-accent/50 bg-card/95'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="font-retro text-xl glow-text flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Study Buddy
          {isDragOver && <Badge className="animate-pulse">Drop here!</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Type Selection */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={contextType === 'question' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContextType('question')}
            className="font-retro text-xs"
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Ask Question
          </Button>
          <Button
            variant={contextType === 'summary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContextType('summary')}
            className="font-retro text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Summarize Chat
          </Button>
          <Button
            variant={contextType === 'explanation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setContextType('explanation')}
            className="font-retro text-xs"
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Explain Topic
          </Button>
        </div>

        {/* Select from chat button */}
        {onSelectFromChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectFromChat}
            className="font-retro w-full"
          >
            <MousePointerClick className="w-4 h-4 mr-2" />
            Select Message from Chat
          </Button>
        )}

        {/* Input */}
        <div className="space-y-2">
          {selectedMessage && onClearSelectedMessage && (
            <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/30">
              <span className="font-retro text-xs text-muted-foreground">Message selected from chat</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearSelectedMessage();
                  setMessage('');
                }}
                className="h-6 px-2"
              >
                Clear
              </Button>
            </div>
          )}
          <Textarea
            placeholder={
              contextType === 'summary' 
                ? "I have access to the chat history! Just provide your instructions (e.g., 'Summarize key points', 'Give me main topics discussed', etc.)" 
                : contextType === 'explanation'
                ? "What topic would you like me to explain?"
                : "Ask me anything... or select a message from chat!"
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="font-retro min-h-[80px] bg-background/50"
          />
          <Button
            onClick={askAI}
            disabled={loading || !message.trim()}
            className="w-full font-retro"
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Ask AI (+5 XP)
              </>
            )}
          </Button>
        </div>

        {/* Response */}
        {response && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-2">
            <Badge variant="secondary" className="font-retro text-xs">
              <Bot className="w-3 h-3 mr-1" />
              AI Response
            </Badge>
            <p className="font-retro text-sm leading-relaxed whitespace-pre-wrap">
              {response}
            </p>
          </div>
        )}

        <p className="text-xs font-retro text-muted-foreground text-center pt-2">
          Earn 5 XP for each AI interaction
        </p>
      </CardContent>
    </Card>
  );
}
