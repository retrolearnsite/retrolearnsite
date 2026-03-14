import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, Copy, LogOut, Trash2, Globe, Lock, Hash } from 'lucide-react';
import { useWorkRooms } from '@/hooks/useWorkRooms';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type WorkRoom = Database['public']['Tables']['work_rooms']['Row'];

interface WorkRoomCardProps {
  room: WorkRoom;
  onEnterRoom: (room: WorkRoom) => void;
  isCreator: boolean;
}

function MemberAvatars({ count }: { count: number }) {
  const colors = ['var(--crt-orange)', 'var(--crt-teal)', 'var(--crt-yellow)'];
  const shown = Math.min(count, 3);
  const remaining = count - shown;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {Array.from({ length: shown }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-medium border-2 border-card"
            style={{ background: colors[i % colors.length], color: '#131110', zIndex: shown - i }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
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
    if (!success) setIsDeleting(false);
  };

  return (
    <div
      className="group bg-card border border-border rounded-lg w-full h-full flex flex-col p-0 hover:border-[var(--border-accent)] transition-all duration-150 hover:-translate-y-0.5"
      style={{ borderTop: '3px solid var(--crt-teal)' }}
    >
      <CardHeader className="space-y-3 flex-shrink-0 p-5 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {room.is_public ? (
              <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-orange bg-[rgba(232,98,42,0.12)] text-crt-orange font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
                <span>◉</span> PUBLIC
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-teal bg-[rgba(62,207,207,0.12)] text-crt-teal font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
                <span>⬡</span> PRIVATE
              </span>
            )}
            {isCreator && (
              <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-yellow bg-[rgba(240,192,64,0.12)] text-crt-yellow font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
                <span>★</span> ADMIN
              </span>
            )}
          </div>
          {!room.is_public && room.code && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>

        <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
          {room.name}
        </CardTitle>

        {room.description && (
          <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {room.description}
          </CardDescription>
        )}

        {room.subject_tags && room.subject_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.subject_tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                <Hash className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {room.subject_tags.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{room.subject_tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col justify-end p-5 pt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <MemberAvatars count={room.member_count || 0} />
          <span className="inline-flex items-center gap-1 px-2 py-[3px] border border-crt-green bg-[rgba(76,175,130,0.12)] text-crt-green font-mono text-[11px] uppercase tracking-[0.06em]" style={{ borderRadius: '2px' }}>
            <span>●</span> ACTIVE
          </span>
        </div>

        {/* Always show code row for consistent card height */}
        <div className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50">
          <span className="text-xs text-muted-foreground font-mono">Code:</span>
          <span className="font-mono text-xs text-foreground tracking-wider">
            {!room.is_public && room.code ? room.code : '——————'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onEnterRoom(room)}
            className="flex-1 font-mono text-xs uppercase tracking-[0.06em] border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            size="sm"
            style={{ borderRadius: '4px' }}
          >
            ▶ ENTER ROOM
          </Button>
          
          {!isCreator && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              style={{ borderRadius: '4px' }}
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
              className="text-destructive hover:text-destructive"
              style={{ borderRadius: '4px' }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </div>
  );
}
