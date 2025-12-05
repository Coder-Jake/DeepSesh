import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import { useProfilePopUp } from '@/contexts/ProfilePopUpContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getSociabilityGradientColor } from '@/lib/utils';
import { DemoSession, ParticipantSessionData } from '@/types/timer';

interface SessionCardProps {
  session: DemoSession;
  onJoinSession: (session: DemoSession) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onJoinSession }) => {
  const { formatTime, isRunning, isScheduleActive, isSchedulePending } = useTimer();
  const { toggleProfilePopUp } = useProfilePopUp();
  const { getPublicProfile, profile } = useProfile(); // Get profile from useProfile

  const currentUserId = profile?.id; // Get current user's ID

  // Check if the current user is a participant in this specific session
  const isUserInThisSession = useMemo(() => {
    if (!currentUserId) return false;
    return session.participants.some(p => p.userId === currentUserId);
  }, [session.participants, currentUserId]);

  // Determine if any timer/schedule is active for the current user
  const isAnySessionActive = isRunning || isScheduleActive || isSchedulePending;

  // Calculate total duration from fullSchedule
  const totalDurationMinutes = useMemo(() => {
    return session.fullSchedule.reduce((sum, phase) => sum + phase.durationMinutes, 0);
  }, [session.fullSchedule]);

  // Calculate total focus and break minutes for the entire schedule
  const totalFocusMinutes = useMemo(() => {
    return session.fullSchedule.filter(phase => phase.type === 'focus').reduce((sum, phase) => sum + phase.durationMinutes, 0);
  }, [session.fullSchedule]);

  const totalBreakMinutes = useMemo(() => {
    return session.fullSchedule.filter(phase => phase.type === 'break').reduce((sum, phase) => sum + phase.durationMinutes, 0);
  }, [session.fullSchedule]);

  // Calculate average focusPreference of participants
  const averageFocusPreference = useMemo(() => {
    if (session.participants.length === 0) return 0;
    const totalFocusPreference = session.participants.reduce((sum, p) => sum + (p.focusPreference || 0), 0);
    return totalFocusPreference / session.participants.length;
  }, [session.participants]);

  // State for dynamically calculated current phase and remaining time
  const [currentPhaseInfo, setCurrentPhaseInfo] = useState<{
    type: 'focus' | 'break';
    durationMinutes: number;
    remainingSeconds: number;
    isEnded: boolean;
  }>(() => calculateCurrentPhaseInfo(session));

  // State to toggle display of phase duration
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
        type: 'focus',
        durationMinutes: 0,
        remainingSeconds: 0,
        isEnded: true,
      };
    }

    // If the session hasn't started yet
    if (elapsedSecondsSinceSessionStart < 0) {
      return {
        type: currentSession.fullSchedule[0]?.type || 'focus',
        durationMinutes: currentSession.fullSchedule[0]?.durationMinutes || 0,
        remainingSeconds: -elapsedSecondsSinceSessionStart,
        isEnded: false,
      };
    }

    // Calculate the effective elapsed time within one full cycle of the schedule
    const effectiveElapsedSeconds = totalScheduleDurationSeconds > 0 ? elapsedSecondsSinceSessionStart % totalScheduleDurationSeconds : 0;

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
      isEnded: true, // Mark as ended if it falls outside the schedule
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhaseInfo(calculateCurrentPhaseInfo(session));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const { type: currentPhaseType, remainingSeconds, isEnded } = currentPhaseInfo;

  if (isEnded) {
    return null;
  }

  const handleParticipantNameClick = async (userId: string, userName: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const targetProfileData = await getPublicProfile(userId, userName);
    if (targetProfileData) {
      toggleProfilePopUp(targetProfileData.id, targetProfileData.first_name || userName, event.clientX, event.clientY);
    } else {
      toggleProfilePopUp(userId, userName, event.clientX, event.clientY);
    }
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null || distance === undefined) return null;
    if (distance < 1000) {
      return `~${Math.round(distance)}m`;
    } else {
      return `~${(distance / 1000).toFixed(1)}km`;
    }
  };

  return (
    <Card key={session.id}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={cn(
              "text-lg",
              isUserInThisSession ? (
                session.visibility === 'public' ? "text-public-text" :
                session.visibility === 'private' ? "text-private-text" :
                session.visibility === 'organisation' ? "text-organisation-text" : "text-foreground"
              ) : "text-foreground" // Default to text-foreground if user is not in session
            )}>
              {session.title}
            </CardTitle>
          </div>
          <div
            className="text-sm text-muted-foreground cursor-pointer select-none flex flex-col items-end"
            onClick={() => setShowPhaseDuration(prev => !prev)}
          >
            <span>
              {formatTime(remainingSeconds)} {currentPhaseType === 'break' ? 'Break' : 'Focus'}
            </span>
            {showPhaseDuration && (
              <span className="">
                <span className={cn(currentPhaseType === 'focus' && "font-bold")}>
                  {totalFocusMinutes}
                </span>
                /
                <span className={cn(currentPhaseType === 'break' && "font-bold")}>
                  {totalBreakMinutes}
                </span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-grow mr-4">
            <Popover>
              <PopoverTrigger className="text-sm text-muted-foreground cursor-pointer select-none">
                {/* FIX: Wrap conditional text in a span */}
                <span>
                  {session.distance !== null ? formatDistance(session.distance) : `~${totalDurationMinutes}m`}
                </span>
              </PopoverTrigger>
              <PopoverContent className="select-none">
                <div className="text-center">
                  <p className="mb-2 font-medium">{session.location}</p>
                  <img
                    src={`https://via.placeholder.com/192x112/f0f0f0/333333?text=Map`}
                    alt={`Map of ${session.location}`}
                    className="w-48 h-28 object-cover rounded"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{session.workspaceDescription}</p>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger className="text-sm text-muted-foreground cursor-pointer select-none">
                {/* FIX: Wrap conditional text in a span */}
                <span>
                  {session.participants.length} {session.participants.length === 1 ? 'coworker' : 'coworkers'}
                </span>
              </PopoverTrigger>
              <PopoverContent className="select-none">
                <div className="space-y-3">
                  {session.participants.map(p => (
                    <div key={p.userId} className="flex items-center justify-between gap-4">
                      <span
                        className={cn(
                          "min-w-0",
                          p.userId !== "mock-user-id-123" && "cursor-pointer"
                        )}
                        onClick={(e) => handleParticipantNameClick(p.userId, p.userName, e)}
                      >
                        {p.userName}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width: `${p.focusPreference || 0}%`, backgroundColor: getSociabilityGradientColor(p.focusPreference || 0)}}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden flex-grow px-1 max-w-[150px]">
                    <div className="h-full rounded-full" style={{width: `${averageFocusPreference}%`, backgroundColor: getSociabilityGradientColor(averageFocusPreference)}}></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Focus preference</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {!isAnySessionActive && ( // Hide join button if any session is active
            <Button size="sm" onClick={() => onJoinSession(session)}>Join</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;