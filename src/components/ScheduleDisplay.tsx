import React from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils'; // Assuming cn utility exists for conditional class names

const ScheduleDisplay = () => {
  const { schedule, currentScheduleIndex } = useTimer();

  if (schedule.length === 0) {
    return <p className="text-muted-foreground">No schedule defined.</p>;
  }

  return (
    <div className="space-y-2">
      {schedule.map((item, index) => (
        <div
          key={index}
          className={cn(
            "p-3 rounded-md flex items-center justify-between transition-all duration-200",
            item.type === 'focus' ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800",
            index === currentScheduleIndex && "ring-2 ring-offset-2 ring-primary" // Highlight active item
          )}
        >
          <span className="font-medium capitalize">{item.type}</span>
          <span className="text-sm">{item.durationMinutes} minutes</span>
        </div>
      ))}
    </div>
  );
};

export default ScheduleDisplay;