import React from 'react';
import { ScheduledTimer } from "@/types/timer";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimelineProps {
  schedule: ScheduledTimer[];
  currentScheduleIndex: number;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  scheduleTitle: string; // New prop
  commenceTime: string; // New prop
  commenceDay: number; // New prop
}

const Timeline: React.FC<TimelineProps> = ({ schedule, currentScheduleIndex, timeLeft, formatTime, scheduleTitle, commenceTime, commenceDay }) => {
  const { isRunning, isPaused, setIsRunning, setIsPaused, resetSchedule } = useTimer();

  if (schedule.length === 0) {
    return null;
  }

  const currentItem = schedule[currentScheduleIndex];
  const progressPercentage = currentItem ? ((currentItem.durationMinutes * 60 - timeLeft) / (currentItem.durationMinutes * 60)) * 100 : 0;

  const calculateStartTime = (index: number) => {
    const [hours, minutes] = commenceTime.split(':').map(Number);
    let totalMinutesOffset = 0;

    for (let i = 0; i < index; i++) {
      totalMinutesOffset += schedule[i].durationMinutes;
    }

    let currentHour = hours;
    let currentMinute = minutes + totalMinutesOffset;

    currentHour += Math.floor(currentMinute / 60);
    currentMinute %= 60;
    currentHour %= 24; // Handle overflow past 24 hours

    return `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-8 p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{scheduleTitle}</h3> {/* Display schedule title */}
       
        </div>
      </div>
      
      <div className="flex overflow-x-auto pb-2 space-x-3">
        {schedule.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex-shrink-0 p-3 rounded-md border",
              "w-40", // Fixed width for each item
              item.type === 'focus' ? 'bg-public-bg border-public-bg/50' : 'bg-private-bg border-private-bg/50',
              index === currentScheduleIndex && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">{calculateStartTime(index)}</p> {/* Display start time */}
            <p className="font-medium text-sm truncate">{item.title}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 mr-1" />
              <span>{item.durationMinutes} min</span>
            </div>
            {index === currentScheduleIndex && (
              <div className="mt-2">
                <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(timeLeft)} remaining</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;