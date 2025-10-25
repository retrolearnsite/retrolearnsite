import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  rank: number;
}

interface RoomLeaderboardProps {
  roomId: string;
}

export default function RoomLeaderboard({ roomId }: RoomLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [roomId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    // Get all XP activity for this room
    const { data: xpData, error: xpError } = await supabase
      .from('room_xp_activity')
      .select('user_id, xp_earned')
      .eq('room_id', roomId);

    if (xpError) {
      console.error('Error fetching leaderboard:', xpError);
      setLoading(false);
      return;
    }

    // Aggregate XP by user
    const userXpMap = new Map<string, number>();
    xpData?.forEach(activity => {
      const current = userXpMap.get(activity.user_id) || 0;
      userXpMap.set(activity.user_id, current + activity.xp_earned);
    });

    // Get user profiles
    const userIds = Array.from(userXpMap.keys());
    if (userIds.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    // Create leaderboard entries
    const leaderboardEntries: LeaderboardEntry[] = userIds
      .map((userId, index) => {
        const profile = profiles?.find(p => p.id === userId);
        const xp = userXpMap.get(userId) || 0;
        return {
          user_id: userId,
          user_name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_xp: xp,
          level: Math.floor(xp / 100) + 1,
          rank: index + 1
        };
      })
      .sort((a, b) => b.total_xp - a.total_xp)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
      .slice(0, 10);

    setEntries(leaderboardEntries);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <Award className="w-5 h-5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <Card className="border-2 border-accent/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-retro text-xl glow-text">
            <Trophy className="w-5 h-5 inline mr-2" />
            LEADERBOARD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-retro text-sm text-muted-foreground text-center py-4">
            Loading rankings...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-2 border-accent/30 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-retro text-xl glow-text">
            <Trophy className="w-5 h-5 inline mr-2" />
            LEADERBOARD
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-retro text-sm text-muted-foreground text-center py-4">
            Be the first to earn XP in this room!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-accent/30 bg-card/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-retro text-xl glow-text">
          <Trophy className="w-5 h-5 inline mr-2" />
          LEADERBOARD
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${entry.rank <= 3 
                  ? 'border-accent/50 bg-accent/10' 
                  : 'border-border/30 bg-muted/20'
                }
              `}
            >
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>

              <Avatar className="w-8 h-8">
                <AvatarFallback className="font-retro text-xs bg-primary/20">
                  {entry.user_name[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-retro text-sm font-bold truncate">
                  {entry.user_name}
                </p>
                <p className="font-retro text-xs text-muted-foreground">
                  Level {entry.level} • {entry.total_xp} XP
                </p>
              </div>

              <Badge 
                variant={entry.rank <= 3 ? "default" : "secondary"}
                className="font-retro text-xs"
              >
                #{entry.rank}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
