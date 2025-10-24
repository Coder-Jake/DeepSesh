import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from '@/lib/utils';

interface DemoSession {
  id: string;
  title: string;
  startTime: number;
  location: string;
  workspaceImage: string;
  workspaceDescription: string;
  participants: { id: string; name: string; sociability: number; intention?: string; bio?: string }[];
  fullSchedule: { type: 'focus' | 'break'; durationMinutes: number; }[]; // NEW
}

interface SessionCardProps {
  session: DemoSession;
  onJoinSession: (session: DemoSession) => void;
  onNameClick: (userId: string, userName: string, event: React.MouseEvent) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onJoinSession, onNameClick }) => {
  const { formatTime } = useTimer();
  
  // Calculate total duration from fullSchedule
  const totalDurationMinutes = useMemo(() => {
    return session.fullSchedule.reduce((sum, phase) => sum + phase.durationMinutes, 0);
  }, [session.fullSchedule]);

  // State for dynamically calculated current phase and remaining time
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState<{
    type: 'focus' | 'break';
    durationMinutes: number;
    remainingSeconds: number;
    isEnded: boolean;
  }>(() => calculateCurrentPhaseInfo(session));

  // Helper function to calculate current phase and remaining time
  function calculateCurrentPhaseInfo(currentSession: DemoSession) {
    const now = Date.now();
    const elapsedSecondsSinceSessionStart = Math.floor((now - currentSession.startTime) / 1000);
    let accumulatedDurationSeconds = 0;

    for (let i = 0; i < currentSession.fullSchedule.length; i++) {
      const phase = currentSession.fullSchedule[i];
      const phaseDurationSeconds = phase.durationMinutes * 60;

      if (elapsedSecondsSinceSessionStart < accumulatedDurationSeconds + phaseDurationSeconds) {
        // Current time falls within this phase
        const timeIntoPhase = elapsedSecondsSinceSessionStart - accumulatedDurationSeconds;
        const remainingSeconds = phaseDurationSeconds - timeIntoPhase;
        return {
          type: phase.type,
          durationMinutes: phase.durationMinutes,
          remainingSeconds: Math.max(0, remainingSeconds),
          isEnded: false,
        };
      }
      accumulatedDurationSeconds += phaseDurationSeconds;
    }

    // If elapsed time is beyond the total schedule duration
    return {
      type: currentSession.fullSchedule[currentSession.fullSchedule.length - 1]?.type || 'focus', // Default to last phase type or focus
      durationMinutes: 0,
      remainingSeconds: 0,
      isEnded: true,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhaseInfo(calculateCurrentPhaseInfo(session));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]); // Recalculate if session prop changes

  const { type: currentPhaseType, remainingSeconds, isEnded } = currentPhaseInfo;

  if (isEnded) {
    return null; // Don't render ended sessions
  }

  return (
    <Card key={session.id}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{session.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {currentPhaseType === 'focus' ? 'Deep Work Session' : 'Break Session'}
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentPhaseType === 'break' ? 'Break - ' : ''}{formatTime(remainingSeconds)} remaining
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none">
                ~{totalDurationMinutes}m
              </TooltipTrigger>
              <TooltipContent className="select-none">
                <div className="text-center">
                  <p className="mb-2 font-medium">{session.location}</p>
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
              <TooltipTrigger className="text-sm text-muted-foreground cursor-pointer select-none">
                {session.participants.length} participants
              </TooltipTrigger>
              <TooltipContent className="select-none">
                <div className="space-y-3">
                  {session.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-4">
                      <span 
                        className={cn(
                          "min-w-0",
                          p.id !== "mock-user-id-123" && "cursor-pointer hover:text-primary"
                        )}
                        onClick={(e) => onNameClick(p.id, p.name, e)}
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
                <div className="h-full bg-primary rounded-full" style={{width: '63%'}}></div>
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