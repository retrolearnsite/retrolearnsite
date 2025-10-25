import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Send, Users, FileText, Copy, Share, MessageCircle, Brain, Pin, Sparkles } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import GamificationBadge from '@/components/GamificationBadge';
import RoomLeaderboard from '@/components/RoomLeaderboard';
import AIStudyBuddy from '@/components/AIStudyBuddy';
import RoomMiniQuiz from '@/components/RoomMiniQuiz';
import RoomResources from '@/components/RoomResources';
import SharedNoteWall from '@/components/SharedNoteWall';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentRoom = rooms.find(r => r.id === roomId);

  useEffect(() => {
    if (currentRoom) {
      setRoom(currentRoom);
      loadRoomData();
      refetchMessages();
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-terminal p-8 scanlines flex items-center justify-center">
        <p className="font-retro text-xl glow-text">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-terminal scanlines overflow-y-auto">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-16">
        {/* Header */}
        <div className="space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/workrooms')}
            className="font-retro glow-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rooms
          </Button>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-retro font-bold glow-text">
                  {room.name}
                </h1>
                {room.is_public && (
                  <Badge className="font-retro">
                    <Sparkles className="w-3 h-3 mr-1" />
                    PUBLIC
                  </Badge>
                )}
              </div>
              {room.description && (
                <p className="font-retro text-muted-foreground">{room.description}</p>
              )}
              {room.subject_tags && room.subject_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.subject_tags.map(tag => (
                    <Badge key={tag} variant="outline" className="font-retro text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="font-retro">
                <Users className="w-4 h-4 mr-1" />
                {members.length} members • {onlineUsers.size} online
              </Badge>
              {!room.is_public && room.code && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRoomCode}
                  className="font-retro"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Code: {room.code}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column - Chat & Features */}
          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 gap-1">
                <TabsTrigger value="chat" className="font-retro py-3 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="notes" className="font-retro py-3 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="font-retro py-3 text-xs sm:text-sm">
                  <Brain className="w-4 h-4 mr-1" />
                  Quizzes
                </TabsTrigger>
                <TabsTrigger value="resources" className="font-retro py-3 text-xs sm:text-sm">
                  <Pin className="w-4 h-4 mr-1" />
                  Resources
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-8">
                <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm shadow-neon">
                  <CardHeader>
                    <CardTitle className="font-retro text-xl glow-text flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      LIVE CHAT
                      <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'} className="font-retro text-xs">
                        {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-6">
                     <ScrollArea className="h-[450px] pr-4">
                      <div className="space-y-3">
                        {messages.length === 0 ? (
                          <p className="font-retro text-sm text-muted-foreground text-center py-8">
                            No messages yet. Start the conversation!
                          </p>
                        ) : (
                          messages.map((msg: any) => (
                            <div key={msg.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="font-retro text-xs bg-primary/20">
                                    {msg.user_name?.[0]?.toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-retro text-sm font-bold">
                                  {msg.user_name || 'Unknown'}
                                </span>
                                {onlineUsers.has(msg.user_id) && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                )}
                                <span className="font-retro text-xs text-muted-foreground ml-auto">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="font-retro text-sm ml-8">{msg.message}</p>
                            </div>
                          ))
                        )}
                        <div ref={bottomRef} />
                      </div>
                    </ScrollArea>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={e => setMessageInput(e.target.value)}
                        placeholder="Type a message... (+2 XP)"
                        className="font-retro flex-1"
                      />
                      <Button type="submit" disabled={!messageInput.trim()} className="font-retro">
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-8 space-y-6">
                <SharedNoteWall roomId={roomId!} userId={user?.id!} />
                
                <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-retro text-xl glow-text">Share Your Note</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                      <SelectTrigger className="font-retro">
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
              </TabsContent>

              {/* Quizzes Tab */}
              <TabsContent value="quizzes" className="mt-8">
                <RoomMiniQuiz roomId={roomId!} userId={user?.id!} />
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent value="resources" className="mt-8">
                <RoomResources roomId={roomId!} userId={user?.id!} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* User Gamification */}
            {gamification && (
              <GamificationBadge
                level={gamification.level}
                totalXp={gamification.total_xp}
                badges={gamification.badges}
              />
            )}

            {/* Leaderboard */}
            <RoomLeaderboard roomId={roomId!} />

            {/* AI Study Buddy */}
            <AIStudyBuddy
              roomId={roomId!}
              userId={user?.id!}
              roomMessages={messages}
            />

            {/* Members List */}
            <Card className="border-2 border-primary/30 bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-retro text-xl glow-text">
                  <Users className="w-5 h-5 inline mr-2" />
                  MEMBERS ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="font-retro text-xs bg-primary/20">
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
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </p>
                        </div>
                        {onlineUsers.has(member.user_id) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
