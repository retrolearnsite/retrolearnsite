import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, ExternalLink, Copy, LogOut, Trash2, Globe, Lock, Hash } from 'lucide-react';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type WorkRoom = Database['public']['Tables']['work_rooms']['Row'];

interface WorkRoomCardProps {
  room: WorkRoom;
  onEnterRoom: (room: WorkRoom) => void;
  isCreator: boolean;
}

export function WorkRoomCard({ room, onEnterRoom, isCreator }: WorkRoomCardProps) {
  const { leaveRoom, deleteRoom } = useWorkRooms();
  const { toast } = useToast();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyCode = () => {
    if (room.code) {
      navigator.clipboard.writeText(room.code);
      toast({
        title: "Code copied!",
        description: "Room code has been copied to clipboard",
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (isCreator) {
      toast({
        title: "Cannot leave",
        description: "Room creators cannot leave their own rooms",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    await leaveRoom(room.id);
    setIsLeaving(false);
  };

  const handleDeleteRoom = async () => {
    if (!isCreator) return;

    setIsDeleting(true);
    const success = await deleteRoom(room.id);
    if (!success) {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group hover:scale-105 transition-all duration-300 border-2 border-primary/30 hover:border-primary/60 bg-card/90 backdrop-blur-sm hover:shadow-neon">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={room.is_public ? "default" : "secondary"} className="font-retro text-xs">
              {room.is_public ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  PUBLIC
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  PRIVATE
                </>
              )}
            </Badge>
            {isCreator && (
              <Badge variant="outline" className="font-retro text-xs">
                ADMIN
              </Badge>
            )}
          </div>
          {!room.is_public && room.code && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 w-7 p-0 font-retro"
            >
              <Copy className="h-3 h-3" />
            </Button>
          )}
        </div>

        <CardTitle className="font-retro text-xl glow-text line-clamp-2 leading-tight">
          {room.name}
        </CardTitle>

        {room.description && (
          <CardDescription className="font-retro text-sm line-clamp-2 min-h-[2.5rem]">
            {room.description}
          </CardDescription>
        )}

        {room.subject_tags && room.subject_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.subject_tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="font-retro text-xs">
                <Hash className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {room.subject_tags.length > 3 && (
              <Badge variant="outline" className="font-retro text-xs">
                +{room.subject_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-xs font-retro text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{room.member_count || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>Active</span>
          </div>
        </div>

        {!room.is_public && room.code && (
          <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50">
            <span className="text-xs font-retro text-muted-foreground">Code:</span>
            <Badge variant="outline" className="font-mono font-retro text-xs">
              {room.code}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onEnterRoom(room)}
            className="flex-1 font-retro"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Enter Room
          </Button>
          
          {!isCreator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="font-retro"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
          
          {isCreator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="font-retro text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
