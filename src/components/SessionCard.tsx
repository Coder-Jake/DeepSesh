import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext"; // Import useTimer to use formatTime
import { cn } from '@/lib/utils'; // Import cn

interface DemoSession {
  id: string;
  title: string;
  type: 'focus' | 'break';
  totalDurationMinutes: number;
  currentPhase: 'focus' | 'break';
  currentPhaseDurationMinutes: number;
  startTime: number;
  location: string;
  workspaceImage: string; // This will now be replaced by a map placeholder
  workspaceDescription: string;
  participants: { id: string; name: string; sociability: number; intention?: string; bio?: string }[];
}

interface SessionCardProps {
  session: DemoSession;
  onJoinSession: (session: DemoSession) => void;
  onNameClick: (userId: string, userName: string, event: React.MouseEvent) => void; // NEW: Add onNameClick prop
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onJoinSession, onNameClick }) => {
  const { formatTime } = useTimer(); // Destructure formatTime from useTimer
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const elapsedSeconds = Math.floor((Date.now() - session.startTime) / 1000);
    return Math.max(0, session.currentPhaseDurationMinutes * 60 - elapsedSeconds);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const remainingTimeDisplay = formatTime(remainingSeconds);

  return (
    <Card key={session.id}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{session.type === 'focus' ? 'Deep Work Session' : 'Break Session'}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {session.currentPhase === 'break' ? 'Break - ' : ''}{remainingTimeDisplay} remaining
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                ~{session.totalDurationMinutes}m
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="mb-2 font-medium">{session.location}</p>
                  {/* Replaced workspace image with a generic map placeholder. For a dynamic map, integration with a map service API would be needed. */}
                  <img 
                    src={`https://via.placeholder.com/192x112/f0f0f0/333333?text=Map`} 
                    alt={`Map of ${session.location}`} 
                    className="w-48 h-28 object-cover rounded" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">{session.workspaceDescription}</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer">
                {session.participants.length} participants
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-3">
                  {session.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-4">
                      <span 
                        className={cn(
                          "min-w-0",
                          p.id !== "mock-user-id-123" && "cursor-pointer hover:text-primary" // Make clickable if not current user
                        )}
                        onClick={(e) => onNameClick(p.id, p.name, e)} // NEW: Call onNameClick
                      >
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{width: `${p.sociability}%`}}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2">
              <div className="w-12 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{width: '63%'}}></div> {/* Placeholder for average sociability */}
              </div>
            </div>
          </div>
          <Button size="sm" onClick={() => onJoinSession(session)}>Join</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;