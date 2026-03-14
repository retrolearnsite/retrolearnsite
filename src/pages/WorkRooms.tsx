import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { WorkRoomCard } from '@/components/WorkRoomCard';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/JoinRoomDialog';
import DiscoverRooms from '@/components/DiscoverRooms';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { ArrowLeft, Users, Globe, Home, Plus, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { ContinueGuideButton } from '@/components/ContinueGuideButton';
import { motion } from 'framer-motion';

type WorkRoom = Database['public']['Tables']['work_rooms']['Row'];

export default function WorkRooms() {
  const { user } = useAuth();
  const { rooms, loading, refetch } = useWorkRooms();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'discover'>('my-rooms');

  const handleEnterRoom = (room: WorkRoom) => {
    navigate(`/workroom/${room.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background" style={{ padding: '28px 32px' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg animate-pulse" />
              <Skeleton className="h-8 w-48 animate-pulse" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ padding: '28px 32px' }}>
      <div className="max-w-7xl mx-auto space-y-7">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="font-mono text-xs uppercase tracking-[0.06em]"
            style={{ borderRadius: '4px' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Hero — scanlines only here */}
          <div className="text-center space-y-4 relative crt-scanlines crt-glow rounded-lg" style={{ padding: '40px 0 32px' }}>
            <div className="relative z-10">
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-display text-glow-orange"
              >
                WORK<span className="text-primary">ROOMS</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[15px] text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-3"
              >
                <span className="text-crt-yellow font-medium">Collaborate</span>, share knowledge, and <span className="text-primary font-medium">learn together</span> in study rooms
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full space-y-7">
          <div className="flex justify-center">
            <ExpandableTabs
              tabs={[
                { title: "MY ROOMS", icon: Home },
                { title: "DISCOVER", icon: Globe },
              ]}
              activeColor="text-primary"
              className="border border-border bg-card/90 backdrop-blur-sm font-mono"
              onChange={index => {
                if (index === 0) setActiveTab('my-rooms');
                else if (index === 1) setActiveTab('discover');
              }}
            />
          </div>

          {activeTab === 'my-rooms' && (
            <div className="space-y-6">
              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center gap-4 flex-wrap"
              >
                <CreateRoomDialog onRoomCreated={refetch} />
                <JoinRoomDialog onRoomJoined={refetch} />
              </motion.div>

              {rooms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center py-16"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full border-2 border-primary/30"
                    style={{ background: 'linear-gradient(135deg, rgba(232,98,42,0.15), rgba(62,207,207,0.15))' }}
                  >
                    <Users className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">No Rooms Yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first work room or join an existing one to start collaborating
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <CreateRoomDialog onRoomCreated={refetch} />
                    <JoinRoomDialog onRoomJoined={refetch} />
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                    >
                      <WorkRoomCard room={room} onEnterRoom={handleEnterRoom} isCreator={room.creator_id === user?.id} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="mt-4">
              <DiscoverRooms />
            </div>
          )}
        </motion.div>

        <ContinueGuideButton />
      </div>
    </div>
  );
}
