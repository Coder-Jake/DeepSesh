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

  // NEW: State to toggle display of phase duration
  const [showPhaseDuration, setShowPhaseDuration] = useState(false);

  // Helper function to calculate current phase and remaining time for repeating schedules
  function calculateCurrentPhaseInfo(currentSession: DemoSession): {
    type: 'focus' | 'break';
    durationMinutes: number;
    remainingSeconds: number;
    isEnded: boolean;
  } {
    const now = Date.now();
    const elapsedSecondsSinceSessionStart = Math.floor((now - currentSession.startTime) / 1000);

    // Calculate total duration of the defined schedule
    const totalScheduleDurationSeconds = currentSession.fullSchedule.reduce(
      (sum, phase) => sum + phase.durationMinutes * 60,
      0
    );

    if (totalScheduleDurationSeconds === 0) {
      return {
        type: 'focus', // Default type
        durationMinutes: 0,
        remainingSeconds: 0,
        isEnded: true, // No schedule, so it's effectively ended
      };
    }

    // If the session hasn't started yet
    if (elapsedSecondsSinceSessionStart < 0) {
      return {
        type: currentSession.fullSchedule[0]?.type || 'focus', // Default to first phase type or focus
        durationMinutes: currentSession.fullSchedule[0]?.durationMinutes || 0,
        remainingSeconds: -elapsedSecondsSinceSessionStart, // Time until it starts
        isEnded: false,
      };
    }

    // Calculate the effective elapsed time within one full cycle of the schedule
    const effectiveElapsedSeconds = elapsedSecondsSinceSessionStart % totalScheduleDurationSeconds;

    let accumulatedDurationSecondsInCycle = 0;
    for (let i = 0; i < currentSession.fullSchedule.length; i++) {
      const phase = currentSession.fullSchedule[i];
      const phaseDurationSeconds = phase.durationMinutes * 60;

      if (effectiveElapsedSeconds < accumulatedDurationSecondsInCycle + phaseDurationSeconds) {
        // Current effective time falls within this phase
        const timeIntoPhase = effectiveElapsedSeconds - accumulatedDurationSecondsInCycle;
        const remainingSeconds = phaseDurationSeconds - timeIntoPhase;
        return {
          type: phase.type,
          durationMinutes: phase.durationMinutes,
          remainingSeconds: Math.max(0, remainingSeconds),
          isEnded: false,
        };
      }
      accumulatedDurationSecondsInCycle += phaseDurationSeconds;
    }

    // This case should ideally not be reached if effectiveElapsedSeconds is correctly calculated
    // and the loop covers all phases. It would imply effectiveElapsedSeconds is exactly
    // totalScheduleDurationSeconds, meaning the very end of a cycle.
    // For safety, return the last phase's info with 0 remaining.
    const lastPhase = currentSession.fullSchedule[currentSession.fullSchedule.length - 1];
    return {
      type: lastPhase?.type || 'focus',
      durationMinutes: lastPhase?.durationMinutes || 0,
      remainingSeconds: 0,
      isEnded: false, // Still not "ended" if it repeats indefinitely
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
          <div 
            className="text-sm text-muted-foreground cursor-pointer select-none"
            onClick={() => setShowPhaseDuration(prev => !prev)}
          >
            {currentPhaseType === 'break' ? 'Break - ' : ''}
            {formatTime(remainingSeconds)} remaining
            {showPhaseDuration && (
              <span className="ml-1">
                ({currentPhaseInfo.durationMinutes}m {currentPhaseType === 'focus' ? 'Focus' : 'Break'})
              </span>
            )}
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