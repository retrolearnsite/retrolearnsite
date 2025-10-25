import { useAuth } from '@/hooks/useAuth';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { WorkRoomCard } from '@/components/WorkRoomCard';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/JoinRoomDialog';
import DiscoverRooms from '@/components/DiscoverRooms';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Globe, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { ContinueGuideButton } from '@/components/ContinueGuideButton';

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
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-terminal p-4 md:p-8 scanlines">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="font-retro glow-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-6xl font-retro font-bold glow-text">
              WORK ROOMS
            </h1>
            <p className="text-base md:text-lg font-retro text-muted-foreground max-w-2xl mx-auto">
              Collaborate, share knowledge, and learn together in public or private study rooms
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="my-rooms" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-auto p-1">
            <TabsTrigger value="my-rooms" className="font-retro py-3">
              <Home className="w-4 h-4 mr-2" />
              MY ROOMS
            </TabsTrigger>
            <TabsTrigger value="discover" className="font-retro py-3">
              <Globe className="w-4 h-4 mr-2" />
              DISCOVER
            </TabsTrigger>
          </TabsList>

          {/* My Rooms Tab */}
          <TabsContent value="my-rooms" className="mt-8 space-y-6">
            {/* Actions */}
            <div className="flex justify-center gap-4 flex-wrap">
              <CreateRoomDialog onRoomCreated={refetch} />
              <JoinRoomDialog onRoomJoined={refetch} />
            </div>

            {/* Rooms Grid */}
            {rooms.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20">
                  <Users className="h-10 w-10 text-primary" />
                </div>
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
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                  <WorkRoomCard
                    key={room.id}
                    room={room}
                    onEnterRoom={handleEnterRoom}
                    isCreator={room.creator_id === user?.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-8">
            <DiscoverRooms />
          </TabsContent>
        </Tabs>
        
        {/* Guide Continue Button */}
        <ContinueGuideButton />
      </div>
    </div>
  );
}
