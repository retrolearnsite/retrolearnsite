import { useAuth } from '@/hooks/useAuth';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { WorkRoomCard } from '@/components/WorkRoomCard';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/JoinRoomDialog';
import DiscoverRooms from '@/components/DiscoverRooms';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const handleEnterRoom = (room: WorkRoom) => {
    navigate(`/workroom/${room.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full animate-pulse" />
              <Skeleton className="h-8 w-48 animate-pulse" />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-56 rounded-lg animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="font-retro glow-border hover:shadow-neon transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center space-y-4">
            <motion.h1
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-retro font-bold glow-text"
            >
              WORK ROOMS
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg font-retro text-muted-foreground max-w-2xl mx-auto"
            >
              Collaborate, share knowledge, and learn together in public or private study rooms
            </motion.p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="my-rooms" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1.5 bg-card/90 backdrop-blur-sm border-2 border-primary/30 shadow-neon">
              <TabsTrigger
                value="my-rooms"
                className="font-retro py-3 data-[state=active]:bg-primary/20 data-[state=active]:shadow-neon transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                MY ROOMS
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="font-retro py-3 data-[state=active]:bg-primary/20 data-[state=active]:shadow-neon transition-all"
              >
                <Globe className="w-4 h-4 mr-2" />
                DISCOVER
              </TabsTrigger>
            </TabsList>

            {/* My Rooms Tab */}
            <TabsContent value="my-rooms" className="mt-8 space-y-6">
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

              {/* Rooms Grid */}
              {rooms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center py-16"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30"
                  >
                    <Users className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-2xl font-retro font-bold glow-text mb-3">
                    No Rooms Yet
                  </h3>
                  <p className="font-retro text-muted-foreground mb-6 max-w-md mx-auto">
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
                      <WorkRoomCard
                        room={room}
                        onEnterRoom={handleEnterRoom}
                        isCreator={room.creator_id === user?.id}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Discover Tab */}
            <TabsContent value="discover" className="mt-8">
              <DiscoverRooms />
            </TabsContent>
          </Tabs>
        </motion.div>
        
        {/* Guide Continue Button */}
        <ContinueGuideButton />
      </div>
    </div>
  );
}
