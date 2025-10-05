import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScheduledTimer } from "@/types/timer";
import { cn } from "@/lib/utils";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext";

interface TimelineProps {
  schedule: ScheduledTimer[]; // Now represents the active/prepared schedule
  currentScheduleIndex: number;
  timeLeft: number;
  commenceTime: string;
  commenceDay: number;
  isSchedulePending: boolean;
  onCountdownEnd: () => void;
  timerColors: Record<string, string>; // NEW: Receive timerColors as prop
}

const Timeline: React.FC<TimelineProps> = ({
  schedule, // Now activeSchedule
  currentScheduleIndex,
  timeLeft,
  commenceTime,
  commenceDay,
  isSchedulePending,
  onCountdownEnd,
  timerColors, // NEW: Destructure timerColors
}) => {
  const { formatTime, isScheduleActive, is24HourFormat, activeScheduleDisplayTitle } = useTimer(); // Removed scheduleTitle, added activeScheduleDisplayTitle
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Removed localTimelineTitle state and its useEffect, now using activeScheduleDisplayTitle directly

  const getCommenceTargetDate = useCallback(() => {
    const now = new Date();
    const [hours, minutes] = commenceTime.split(':').map(Number);
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const currentDay = now.getDay();
    const daysToAdd = (commenceDay - currentDay + 7) % 7;
    targetDate.setDate(now.getDate() + daysToAdd);

    // If the target time is in the past for today, set it for next week
    if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
      targetDate.setDate(targetDate.getDate() + 7);
    }
    return targetDate;
  }, [commenceTime, commenceDay]);

  useEffect(() => {
    if (isSchedulePending) {
      const calculateCountdown = () => {
        const targetDate = getCommenceTargetDate();
        const timeRemaining = Math.max(0, Math.floor((targetDate.getTime() - new Date().getTime()) / 1000));
        setCountdownTimeLeft(timeRemaining);

        if (timeRemaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          onCountdownEnd(); // Trigger the actual schedule start
        }
      };

      calculateCountdown(); // Initial calculation
      countdownIntervalRef.current = setInterval(calculateCountdown, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [isSchedulePending, getCommenceTargetDate, onCountdownEnd]);

  const totalScheduleDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);

  const targetDayName = DAYS_OF_WEEK[commenceDay];
  const targetDateForDisplay = getCommenceTargetDate();
  const formattedTargetDate = targetDateForDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate estimated finish time
  let estimatedFinishTime: Date | null = null;
  if (isSchedulePending) {
    const targetDate = getCommenceTargetDate();
    estimatedFinishTime = new Date(targetDate.getTime() + totalScheduleDuration * 60 * 1000);
  } else if (isScheduleActive) {
    const now = Date.now();
    let remainingDurationSeconds = timeLeft; // Time left for the current item
    for (let i = currentScheduleIndex + 1; i < schedule.length; i++) {
      remainingDurationSeconds += schedule[i].durationMinutes * 60; // Add future items
    }
    estimatedFinishTime = new Date(now + remainingDurationSeconds * 1000);
  }

  const formattedFinishTime = estimatedFinishTime 
    ? estimatedFinishTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hourCycle: is24HourFormat ? 'h23' : 'h12' // Use is24HourFormat here
      }) 
    : null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="text-lg font-semibold text-left mb-2">Timeline</h3>
        <CardTitle className="text-xl flex justify-center">
          <Input
            value={activeScheduleDisplayTitle} // Use activeScheduleDisplayTitle
            readOnly // Make it read-only as it's controlled by context
            className="text-2xl font-semibold p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-center"
            aria-label="Timeline Title" // Changed aria-label for clarity
            data-name="Timeline Title Input" // Added data-name
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((item, index) => {
          const isCurrent = index === currentScheduleIndex && !isSchedulePending; // Only current if not pending
          const isCompleted = index < currentScheduleIndex && !isSchedulePending; // Only completed if not pending
          const progress = isCurrent ? (timeLeft / (item.durationMinutes * 60)) * 100 : 0;
          const itemBackgroundColor = timerColors[item.id] || (item.type === 'focus' ? 'hsl(var(--focus-background))' : ''); // Get custom color or default focus background

          return (
            <div
              key={item.id}
              className={cn(
                "relative flex items-center justify-between p-3 rounded-md transition-all duration-300",
                isCompleted && "bg-muted text-muted-foreground opacity-70",
                isCurrent && (item.isCustom ? "bg-blue-100 text-blue-800 shadow-md" :
                              item.type === 'focus' ? "bg-public-bg/20 text-public-bg-foreground shadow-md" :
                              "bg-private-bg/20 text-private-bg-foreground shadow-md"),
                !isCurrent && !isCompleted && "bg-background hover:bg-muted/50"
              )}
              style={{ backgroundColor: itemBackgroundColor }} // Apply custom background color
              data-name={`Timeline Item ${index + 1}: ${item.title}`}
            >
              {isCurrent && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-md opacity-50",
                    item.isCustom ? "bg-blue-200" :
                    item.type === 'focus' ? "bg-public-bg" : "bg-private-bg"
                  )}
                  style={{ width: `${100 - progress}%`, transformOrigin: 'left' }}
                />
              )}
              <div className="relative z-10 flex-grow">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {item.customTitle || (item.type === 'focus' ? 'Focus' : 'Break')} • {item.durationMinutes} mins
                </p>
              </div>
              {isCurrent && (
                <div className="relative z-10 text-lg font-bold">
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
          );
        })}

        {isSchedulePending && (
          <div className="mt-8 pt-6 border-t border-border space-y-2" data-name="Upcoming Schedule Details">
            <h3 className="text-lg font-semibold text-foreground text-left">Upcoming</h3>
            <div className="text-base font-bold text-foreground text-left"> {/* New container */}
              {commenceTime} on {targetDayName}, {formattedTargetDate}
            </div>
            <p className="text-sm text-muted-foreground text-left">Commencing:</p>
            <p className="text-3xl font-extrabold text-primary text-left">
              {formatTime(countdownTimeLeft)}
            </p>
            <p className="text-xs text-muted-foreground text-left">
              Your schedule will automatically begin when the countdown reaches zero.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center space-y-1" data-name="Total Schedule Duration and Finish Time">
          <p className="text-sm text-muted-foreground">Total: {totalScheduleDuration} mins</p>
          {formattedFinishTime && (
            <p className="text-sm text-muted-foreground">Finish: {formattedFinishTime}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;