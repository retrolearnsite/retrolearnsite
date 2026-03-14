import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Search, Users, Globe, Hash, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PublicRoom {
  id: string;
  name: string;
  description: string;
  subject_tags: string[];
  member_count: number;
  creator_id: string;
  created_at: string;
}

export default function DiscoverRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<PublicRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCounts, setOnlineCounts] = useState<Record<string, number>>({});

  useEffect(() => { fetchPublicRooms(); }, []);

  useEffect(() => {
    const channels = rooms.map(room => {
      const channel = supabase.channel(`room_presence_${room.id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          setOnlineCounts(prev => ({ ...prev, [room.id]: Object.keys(state).length }));
        })
        .subscribe();
      return channel;
    });
    return () => { channels.forEach(channel => supabase.removeChannel(channel)); };
  }, [rooms]);

  const fetchPublicRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_rooms').select('*').eq('is_public', true).order('member_count', { ascending: false });
    if (error) {
      toast({ title: "Error loading rooms", description: error.message, variant: "destructive" });
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  const joinRoom = async (roomId: string) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to join rooms", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('room_members').insert({ room_id: roomId, user_id: user.id });
    if (error) {
      if (error.code === '23505') { navigate(`/workroom/${roomId}`); }
      else { toast({ title: "Error joining room", description: error.message, variant: "destructive" }); }
    } else {
      toast({ title: "Joined room!" });
      navigate(`/workroom/${roomId}`);
    }
  };

  const allTags = Array.from(new Set(rooms.flatMap(r => r.subject_tags)));
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || room.subject_tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-display text-glow-orange">DISCOVER ROOMS</h1>
        <p className="text-[15px] text-muted-foreground">Join public study rooms and learn together</p>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search rooms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-card/50 border border-border" />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant={selectedTag === null ? "default" : "outline"} size="sm" onClick={() => setSelectedTag(null)}>All</Button>
            {allTags.map(tag => (
              <Button key={tag} variant={selectedTag === tag ? "default" : "outline"} size="sm" onClick={() => setSelectedTag(tag)}>
                <Hash className="w-3 h-3 mr-1" />{tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map(room => (
          <div key={room.id} className="group bg-card border border-border rounded-lg hover:border-[var(--border-accent)] transition-all duration-150 hover:-translate-y-0.5" style={{ borderTop: '3px solid var(--crt-teal)' }}>
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-orange bg-[rgba(232,98,42,0.12)] text-crt-orange font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
                  <span>◉</span> PUBLIC
                </span>
                {onlineCounts[room.id] > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-green bg-[rgba(76,175,130,0.12)] text-crt-green font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
                    <span>●</span> {onlineCounts[room.id]} online
                  </span>
                )}
              </div>
              <CardTitle className="text-base font-semibold line-clamp-2">{room.name}</CardTitle>
              <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem] leading-relaxed">{room.description || 'No description'}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {room.subject_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.subject_tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                  ))}
                  {room.subject_tags.length > 3 && <Badge variant="outline" className="text-[10px]">+{room.subject_tags.length - 3}</Badge>}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>{room.member_count} members</span></div>
                <div className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /><span>Active</span></div>
              </div>

              <Button
                onClick={() => joinRoom(room.id)}
                variant="outline"
                className="w-full font-mono text-xs uppercase tracking-[0.06em] border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                size="sm"
                style={{ borderRadius: '4px' }}
              >
                ▶ JOIN ROOM
              </Button>
            </CardContent>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && !loading && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Rooms Found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
