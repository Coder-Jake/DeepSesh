import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScheduledTimer } from "@/types/timer";
import { formatTime } from "@/contexts/TimerContext"; // Assuming formatTime is exported from TimerContext
import { cn } from "@/lib/utils";

interface TimelineProps {
  schedule: ScheduledTimer[];
  currentScheduleIndex: number;
  timeLeft: number;
  commenceTime: string; // e.g., "14:30"
  commenceDay: number; // 0 for Sunday, 1 for Monday, etc.
  isSchedulePending: boolean;
  onCountdownEnd: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  schedule,
  currentScheduleIndex,
  timeLeft,
  commenceTime,
  commenceDay,
  isSchedulePending,
  onCountdownEnd,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateStartTime = useCallback(() => {
    if (!commenceTime) return null;

    const [hours, minutes] = commenceTime.split(':').map(Number);
    const now = new Date();
    const targetDate = new Date(now);

    // Set the target day
    const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday
    let daysToAdd = commenceDay - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7; // Wrap around to next week
    }
    targetDate.setDate(now.getDate() + daysToAdd);

    targetDate.setHours(hours, minutes, 0, 0);

    // If the target time is in the past for today, set it for next week
    if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    return targetDate.getTime();
  }, [commenceTime, commenceDay]);

  useEffect(() => {
    if (isSchedulePending) {
      const targetTimestamp = calculateStartTime();
      if (targetTimestamp === null) {
        setCountdown(null);
        return;
      }

      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
        setCountdown(remaining);

        if (remaining === 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onCountdownEnd();
        }
      };

      updateCountdown(); // Initial call
      intervalRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setCountdown(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isSchedulePending, commenceTime, commenceDay, calculateStartTime, onCountdownEnd]);

  const renderCountdown = () => {
    if (countdown === null || countdown <= 0) return null;

    const days = Math.floor(countdown / (3600 * 24));
    const hours = Math.floor((countdown % (3600 * 24)) / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;

    return (
      <div className="text-center text-lg font-semibold text-primary mb-4">
        Schedule starts in: {days > 0 && `${days}d `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    );
  };

  const totalScheduleDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);

  let accumulatedMinutes = 0;

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border">
      <h3 className="text-xl font-bold mb-4">Schedule Timeline</h3>
      {isSchedulePending && renderCountdown()}
      <div className="space-y-2">
        {schedule.map((timer, index) => {
          const isCurrent = index === currentScheduleIndex && !isSchedulePending;
          const isUpcoming = index > currentScheduleIndex || isSchedulePending;
          const isCompleted = index < currentScheduleIndex && !isSchedulePending;

          const startTime = new Date();
          startTime.setHours(0, 0, 0, 0); // Reset to start of day for calculation
          if (commenceTime) {
            const [hours, minutes] = commenceTime.split(':').map(Number);
            startTime.setHours(hours, minutes, 0, 0);
          }

          const currentItemStartTime = new Date(startTime.getTime() + accumulatedMinutes * 60 * 1000);
          accumulatedMinutes += timer.durationMinutes;
          const currentItemEndTime = new Date(startTime.getTime() + accumulatedMinutes * 60 * 1000);

          return (
            <div
              key={timer.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-md border transition-all duration-200",
                timer.type === 'focus' ? 'bg-[hsl(var(--focus-background))]' : 'bg-[hsl(var(--break-background))]',
                isCurrent ? "border-primary ring-2 ring-primary/50 shadow-md" : "border-border",
                isCompleted && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-muted-foreground">{index + 1}.</span>
                <div>
                  <p className="font-medium text-foreground">{timer.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {timer.customTitle || (timer.type === 'focus' ? 'Focus' : 'Break')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">{timer.durationMinutes} min</p>
                <p className="text-xs text-muted-foreground">
                  {currentItemStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {currentItemEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;