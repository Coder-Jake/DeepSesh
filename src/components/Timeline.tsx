import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScheduledTimer } from "@/types/timer";
import { cn } from "@/lib/utils";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext";

interface TimelineProps {
  schedule: ScheduledTimer[];
  currentScheduleIndex: number;
  timeLeft: number;
  commenceTime: string;
  commenceDay: number;
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
  const { formatTime, scheduleTitle, setScheduleTitle } = useTimer();
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSchedulePending) {
      const calculateCountdown = () => {
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
        
        const timeRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));
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
  }, [isSchedulePending, commenceTime, commenceDay, onCountdownEnd]);

  const totalScheduleDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);

  const targetDayName = DAYS_OF_WEEK[commenceDay];
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (commenceDay - targetDate.getDay() + 7) % 7);
  const formattedTargetDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="text-lg font-semibold text-left mb-2">Timeline</h3> {/* Added h3 tag */}
        <CardTitle className="text-xl flex justify-center">
          <Input
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            className="text-2xl font-semibold p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-center"
            aria-label="Schedule Title"
          />
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">Total: {totalScheduleDuration} mins</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {schedule.map((item, index) => {
          const isCurrent = index === currentScheduleIndex && !isSchedulePending; // Only current if not pending
          const isCompleted = index < currentScheduleIndex && !isSchedulePending; // Only completed if not pending
          const progress = isCurrent ? (timeLeft / (item.durationMinutes * 60)) * 100 : 0;

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
          <div className="mt-8 pt-6 border-t border-border text-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Schedule</h3>
            <p className="text-3xl font-bold text-foreground">
              {commenceTime} on {targetDayName}, {formattedTargetDate}
            </p>
            <p className="text-lg text-muted-foreground">Time until start:</p>
            <p className="text-5xl font-extrabold text-primary">
              {formatTime(countdownTimeLeft)}
            </p>
            <p className="text-sm text-muted-foreground">
              Your schedule will automatically begin when the countdown reaches zero.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timeline;