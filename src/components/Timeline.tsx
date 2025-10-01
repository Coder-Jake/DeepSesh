import React from 'react';
import { ScheduledTimer } from '@/types/timer';
import { cn } from '@/lib/utils';

interface TimelineProps {
  schedule: ScheduledTimer[];
  currentScheduleIndex: number;
  timeLeft: number;
  scheduleTitle: string;
  commenceTime: string;
  commenceDay: number;
}

const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const Timeline: React.FC<TimelineProps> = ({
  schedule,
  currentScheduleIndex,
  timeLeft,
  scheduleTitle,
  commenceTime,
  commenceDay,
}) => {
  const totalScheduleDuration = schedule.reduce((sum, item) => sum + item.durationMinutes, 0);

  // Calculate the total elapsed time in minutes for the schedule up to the current item
  const elapsedScheduleMinutes = schedule
    .slice(0, currentScheduleIndex)
    .reduce((sum, item) => sum + item.durationMinutes, 0);

  // Calculate the remaining time for the current item in minutes
  const currentItemRemainingMinutes = Math.ceil(timeLeft / 60);

  // Calculate the total elapsed time including the current item's elapsed portion
  const totalElapsedMinutes = elapsedScheduleMinutes + (schedule[currentScheduleIndex]?.durationMinutes || 0) - currentItemRemainingMinutes;

  // Calculate the estimated end time
  const now = new Date();
  const commenceDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                    parseInt(commenceTime.split(':')[0]), parseInt(commenceTime.split(':')[1]));
  
  // Adjust commenceDateTime to the selected day of the week
  const currentDay = now.getDay();
  const diff = commenceDay - currentDay;
  commenceDateTime.setDate(commenceDateTime.getDate() + diff);

  // If the commence time has already passed for the selected day, move to next week
  if (commenceDateTime.getTime() < now.getTime() && diff <= 0) {
    commenceDateTime.setDate(commenceDateTime.getDate() + 7);
  }

  const estimatedEndTime = new Date(commenceDateTime.getTime() + totalScheduleDuration * 60 * 1000);

  return (
    <div className="mt-8 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-bold mb-2">{scheduleTitle}</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Commencing: {daysOfWeek[commenceDay]} at {commenceTime} (Estimated End: {estimatedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
      </p>
      <div className="space-y-4">
        {schedule.map((item, index) => {
          const isCurrent = index === currentScheduleIndex;
          const isCompleted = index < currentScheduleIndex;
          const itemStartTimeMinutes = schedule.slice(0, index).reduce((sum, prevItem) => sum + prevItem.durationMinutes, 0);
          const itemEndTimeMinutes = itemStartTimeMinutes + item.durationMinutes;

          const currentItemProgress = isCurrent ? ((item.durationMinutes * 60 - timeLeft) / (item.durationMinutes * 60)) * 100 : 0;

          return (
            <div
              key={item.id}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-md transition-all duration-300",
                isCompleted && "bg-muted text-muted-foreground opacity-70",
                isCurrent && (item.isCustom ? "bg-blue-100 text-blue-800 shadow-md" :
                              item.type === 'focus' ? "bg-public-bg/20 text-public-bg-foreground shadow-md" :
                              "bg-private-bg/20 text-private-bg-foreground shadow-md"),
                !isCompleted && !isCurrent && "bg-secondary/30 text-secondary-foreground"
              )}
            >
              {isCurrent && (
                <div
                  className={cn(
                    "absolute inset-0 rounded-md opacity-50",
                    item.isCustom ? "bg-blue-200" :
                    item.type === 'focus' ? "bg-public-bg" : "bg-private-bg"
                  )}
                  style={{ width: `${currentItemProgress}%` }}
                />
              )}
              <span className="relative z-10 font-semibold text-sm">{index + 1}.</span>
              <div className="relative z-10 flex-grow">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.customTitle || (item.type === 'focus' ? 'Focus' : 'Break')} • {item.durationMinutes} mins
                </p>
              </div>
              {isCurrent && (
                <span className="relative z-10 font-bold text-lg">
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;