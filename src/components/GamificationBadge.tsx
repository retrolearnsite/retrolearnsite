import { Trophy, Star, Award, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GamificationBadgeProps {
  level: number;
  totalXp: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    earned_at: string;
  }>;
  compact?: boolean;
}

export default function GamificationBadge({ level, totalXp, badges, compact = false }: GamificationBadgeProps) {
  const xpToNextLevel = (level * 100) - totalXp;
  const progress = ((totalXp % 100) / 100) * 100;

  const getBadgeIcon = (badgeId: string) => {
    if (badgeId.includes('master')) return <Trophy className="w-3 h-3" />;
    if (badgeId.includes('active')) return <Zap className="w-3 h-3" />;
    if (badgeId.includes('quiz')) return <Star className="w-3 h-3" />;
    return <Award className="w-3 h-3" />;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-retro text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Lv.{level}
              </Badge>
              {badges.length > 0 && (
                <Badge variant="outline" className="font-retro text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  {badges.length}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="font-retro">
            <div className="space-y-2">
              <p className="text-sm font-bold">{totalXp} XP Total</p>
              <p className="text-xs text-muted-foreground">
                {xpToNextLevel} XP to Level {level + 1}
              </p>
              {badges.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-bold">Badges:</p>
                  {badges.slice(0, 3).map(badge => (
                    <p key={badge.id} className="text-xs flex items-center gap-1">
                      {getBadgeIcon(badge.id)}
                      {badge.name}
                    </p>
                  ))}
                  {badges.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{badges.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-card/50 border-2 border-primary/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-retro text-lg glow-text">Level {level}</h4>
          <p className="text-xs font-retro text-muted-foreground">{totalXp} XP</p>
        </div>
        <Trophy className="w-8 h-8 text-accent" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-retro text-muted-foreground text-right">
          {xpToNextLevel} XP to next level
        </p>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <h5 className="font-retro text-sm glow-blue">Badges ({badges.length})</h5>
          <div className="flex flex-wrap gap-2">
            {badges.map(badge => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="font-retro text-xs">
                      {getBadgeIcon(badge.id)}
                      <span className="ml-1">{badge.name}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="font-retro">
                    <p className="text-sm">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
