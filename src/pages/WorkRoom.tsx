import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { useRoomChat } from '@/hooks/useRoomChat';
import { useNotes } from '@/hooks/useNotes';
import { useGamification } from '@/hooks/useGamification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, Users, FileText, Copy, Share, MessageCircle, Brain, Pin, Sparkles, ThumbsUp, Lightbulb, Repeat } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import GamificationBadge from '@/components/GamificationBadge';
import RoomLeaderboard from '@/components/RoomLeaderboard';
import AIStudyBuddy from '@/components/AIStudyBuddy';
import RoomMiniQuiz from '@/components/RoomMiniQuiz';
import RoomResources from '@/components/RoomResources';
import SharedNoteWall from '@/components/SharedNoteWall';
import { RoomLoadingScreen } from '@/components/RoomLoadingScreen';
import { MessageBubble } from '@/components/MessageBubble';

type WorkRoom = Database['public']['Tables']['work_rooms']['Row'];

export default function WorkRoom() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { rooms, getRoomMembers, shareNoteToRoom } = useWorkRooms();
  const { messages, sendMessage, refetch: refetchMessages, connectionStatus } = useRoomChat(roomId || '');
  const { notes } = useNotes();
  const { gamification } = useGamification(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [room, setRoom] = useState<WorkRoom | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [messageInput, setMessageInput] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  const currentRoom = rooms.find(r => r.id === roomId);

  useEffect(() => {
    if (currentRoom) {
      setIsLoading(true);
      setRoom(currentRoom);
      loadRoomData();
      refetchMessages();
      
      // Simulate loading delay for smooth animation
      setTimeout(() => setIsLoading(false), 1500);
    }
  }, [currentRoom, roomId]);

  const loadRoomData = async () => {
    if (!roomId) return;
    const membersData = await getRoomMembers(roomId);
    setMembers(membersData);
  };

  // Real-time presence tracking
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`room_presence_${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(state)));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;

    const memberChannel = supabase
      .channel(`room-members-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_members',
        filter: `room_id=eq.${roomId}`
      }, () => {
        getRoomMembers(roomId).then(setMembers);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
    };
  }, [roomId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !user) return;

    await sendMessage(messageInput.trim());
    setMessageInput('');

    // Award XP for sending message
    if (roomId) {
      await supabase.rpc('award_xp', { p_user_id: user.id, p_xp: 2 });
      await supabase.from('room_xp_activity').insert({
        room_id: roomId,
        user_id: user.id,
        activity_type: 'message',
        xp_earned: 2
      });
    }
  };

  const handleShareNote = async () => {
    if (!selectedNoteId || !roomId || !user) return;

    const success = await shareNoteToRoom(roomId, selectedNoteId);
    if (success) {
      setSelectedNoteId('');
      
      // Award XP
      await supabase.rpc('award_xp', { p_user_id: user.id, p_xp: 10 });
      await supabase.from('room_xp_activity').insert({
        room_id: roomId,
        user_id: user.id,
        activity_type: 'note_shared',
        xp_earned: 10
      });
    }
  };

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast({ title: "Code copied!", description: "Room code copied to clipboard" });
    }
  };

  if (isLoading || !room) {
    return <RoomLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-terminal">
      {/* Top Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b-2 border-primary/30 bg-card/95 backdrop-blur-xl"
      >
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/workrooms')}
                className="font-retro hover:glow-border"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-retro font-bold glow-text">
                  {room.name}
                </h1>
                {room.is_public && (
                  <Badge className="font-retro animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PUBLIC
                  </Badge>
                )}
                {room.subject_tags && room.subject_tags.length > 0 && (
                  <div className="hidden md:flex gap-1">
                    {room.subject_tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="font-retro text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-retro">
                <Users className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">{members.length} members • </span>
                <span className="text-green-500">{onlineUsers.size} online</span>
              </Badge>
              {!room.is_public && room.code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRoomCode}
                  className="font-retro hidden md:flex"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {room.code}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-2 md:px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Panel - Chat & Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-9"
          >
            <Tabs defaultValue="chat" value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-card/90 backdrop-blur-sm border-2 border-primary/30 shadow-neon mb-4">
                <TabsTrigger value="chat" className="font-retro py-3 data-[state=active]:bg-primary/20">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="font-retro py-3 data-[state=active]:bg-primary/20">
                  <FileText className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="font-retro py-3 data-[state=active]:bg-primary/20">
                  <Brain className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Quizzes</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="font-retro py-3 data-[state=active]:bg-primary/20">
                  <Pin className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Pinned</span>
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat">
                <Card className="border-2 border-primary/30 bg-card/40 backdrop-blur-xl shadow-neon">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-retro text-lg glow-text flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        LIVE CHAT
                      </CardTitle>
                      <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="font-retro text-xs animate-pulse">
                        {connectionStatus === 'connected' ? '● Connected' : 'Connecting...'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col min-h-0">
                    <div className="flex-1 h-[calc(100vh-400px)] min-h-[500px] px-4 overflow-y-auto">
                      <div className="space-y-4 py-4">
                        <AnimatePresence initial={false}>
                          {messages.length === 0 ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-12"
                            >
                              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                              <p className="font-retro text-sm text-muted-foreground">
                                No messages yet. Start the conversation!
                              </p>
                            </motion.div>
                          ) : (
                            messages.map((msg: any) => (
                              <MessageBubble
                                key={msg.id}
                                message={msg}
                                isOnline={onlineUsers.has(msg.user_id)}
                                isOwn={msg.user_id === user?.id}
                              />
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="p-4 border-t border-border/50 bg-muted/20">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          placeholder="Type a message... (+2 XP)"
                          className="font-retro flex-1 bg-background/50 border-2 border-primary/30 focus:border-primary/60 h-12"
                        />
                        <Button
                          type="submit"
                          disabled={!messageInput.trim()}
                          className="font-retro px-6 h-12"
                          size="lg"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </form>
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm" className="font-retro text-xs">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          React
                        </Button>
                        <Button variant="ghost" size="sm" className="font-retro text-xs">
                          <Lightbulb className="w-3 h-3 mr-1" />
                          Idea
                        </Button>
                        <Button variant="ghost" size="sm" className="font-retro text-xs">
                          <Repeat className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes">
                <div className="space-y-4">
                  <SharedNoteWall roomId={roomId!} userId={user?.id!} />
                  
                  <Card className="border-2 border-primary/30 bg-card/40 backdrop-blur-xl shadow-neon">
                    <CardHeader>
                      <CardTitle className="font-retro text-lg glow-text">Share Your Note</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                        <SelectTrigger className="font-retro border-2 border-primary/30">
                          <SelectValue placeholder="Select a note to share" />
                        </SelectTrigger>
                        <SelectContent>
                          {notes.map(note => (
                            <SelectItem key={note.id} value={note.id} className="font-retro">
                              {note.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleShareNote}
                        disabled={!selectedNoteId}
                        className="w-full font-retro"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share to Room (+10 XP)
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Quizzes Tab */}
              <TabsContent value="quizzes">
                <RoomMiniQuiz roomId={roomId!} userId={user?.id!} />
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources">
                <RoomResources roomId={roomId!} userId={user?.id!} />
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Right Sidebar - AI & Gamification */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 hidden lg:block"
          >
            <div className="space-y-4">
              {/* User Gamification */}
              {gamification && (
                <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <GamificationBadge
                    level={gamification.level}
                    totalXp={gamification.total_xp}
                    badges={gamification.badges}
                  />
                </motion.div>
              )}

              {/* Leaderboard */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <RoomLeaderboard roomId={roomId!} />
              </motion.div>

              {/* AI Study Buddy */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <AIStudyBuddy
                  roomId={roomId!}
                  userId={user?.id!}
                  roomMessages={messages}
                />
              </motion.div>

              {/* Members List */}
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <Card className="border-2 border-primary/30 bg-card/40 backdrop-blur-xl shadow-neon">
                  <CardHeader>
                    <CardTitle className="font-retro text-lg glow-text">
                      <Users className="w-5 h-5 inline mr-2" />
                      MEMBERS ({members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <div className="space-y-2 pr-2">
                        {members.map((member: any) => (
                          <motion.div
                            key={member.id}
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/30"
                          >
                            <Avatar className="w-8 h-8 border-2 border-primary/30">
                              <AvatarFallback className="font-retro text-xs bg-gradient-to-br from-primary/20 to-accent/20">
                                {member.profiles?.full_name?.[0]?.toUpperCase() ||
                                 member.profiles?.email?.[0]?.toUpperCase() ||
                                 '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-retro text-sm font-bold truncate">
                                {member.profiles?.full_name ||
                                 member.profiles?.email?.split('@')[0] ||
                                 'Unknown'}
                              </p>
                              <p className="font-retro text-xs text-muted-foreground">
                                {member.role === 'admin' ? '👑 Admin' : 'Member'}
                              </p>
                            </div>
                            {onlineUsers.has(member.user_id) && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 bg-green-500 rounded-full shadow-green"
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
