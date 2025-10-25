import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GamificationData {
  user_id: string;
  total_xp: number;
  level: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earned_at: string;
  }>;
}

export const useGamification = (userId: string | undefined) => {
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchGamification();
    subscribeToUpdates();
  }, [userId]);

  const fetchGamification = async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create initial gamification record
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({
            user_id: userId,
            total_xp: 0,
            level: 1,
            badges: []
          })
          .select()
          .single();

        if (!insertError && newData) {
          setGamification({
            ...newData,
            badges: (newData.badges as any) || []
          } as GamificationData);
        }
      }
    } else if (data) {
      setGamification({
        ...data,
        badges: (data.badges as any) || []
      } as GamificationData);
    }
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    if (!userId) return;

    const channel = supabase
      .channel(`gamification_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_gamification',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newData = payload.new;
          setGamification({
            ...newData,
            badges: (newData.badges as any) || []
          } as GamificationData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const awardXP = async (xp: number) => {
    if (!userId) return;
    await supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });
  };

  const awardBadge = async (badgeId: string, name: string, description: string) => {
    if (!userId) return;
    await supabase.rpc('award_badge', {
      p_user_id: userId,
      p_badge_id: badgeId,
      p_badge_name: name,
      p_badge_description: description
    });
  };

  return {
    gamification,
    loading,
    awardXP,
    awardBadge,
    refresh: fetchGamification
  };
};
