import React, { useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Trash2, Clock, CalendarDays, ListTodo } from "lucide-react";
import { ScheduledTimer } from "@/types/timer";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/lib/constants"; // Corrected import
import { useTheme } from '@/contexts/ThemeContext'; // NEW: Import useTheme

interface UpcomingScheduleCardContentProps {
  schedule: ScheduledTimer[];
  commenceTime: string;
  commenceDay: number | null;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  activeTimerColors: Record<string, string>;
  commencePreparedSchedule: () => void;
  resetSchedule: () => void;
}

const UpcomingScheduleCardContent: React.FC<UpcomingScheduleCardContentProps> = ({
  schedule,
  commenceTime,
  commenceDay,
  scheduleStartOption,
  activeTimerColors,
  commencePreparedSchedule,
  resetSchedule,
}) => {
  const { formatTime, is24HourFormat } = useTimer();
  const { isDarkMode } = useTheme(); // NEW: Get isDarkMode

  const totalDurationMinutes = useMemo(() => {
    return schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
  }, [schedule]);

  // This getCommenceInfo is not used here, but in the AccordionTrigger.
  // Keeping it here for completeness if it were to be used internally.
  const getCommenceInfo = useCallback(() => {
    if (scheduleStartOption === 'manual') {
      return "Ready to start manually.";
    } else if (scheduleStartOption === 'custom_time') {
      const [hours, minutes] = commenceTime.split(':').map(Number);
      const formattedTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: is24HourFormat ? 'h23' : 'h12'
      });
      const dayName = commenceDay !== null ? DAYS_OF_WEEK[commenceDay] : "Today";
      return `Starts at ${formattedTime} on ${dayName}.`;
    }
    return "";
  }, [commenceTime, commenceDay, scheduleStartOption, is24HourFormat]);

  return (
    <div className="space-y-4"> {/* This div replaces CardContent */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{totalDurationMinutes} mins total</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          <span>{schedule.length} timers</span>
        </div>
      </div>

      <div className="space-y-1 pr-2">
        {schedule.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between p-2 rounded-md text-sm",
              // NEW: Use the solid focus background color based on theme
              item.type === 'focus' ? (isDarkMode ? "bg-[hsl(var(--focus-background-solid-dark))]" : "bg-[hsl(var(--focus-background-solid-light))]") :
              (isDarkMode ? "bg-[hsl(var(--break-background-solid-dark))]" : "bg-[hsl(var(--break-background-solid-light))]") // NEW: Use solid break background
            )}
            style={{ backgroundColor: activeTimerColors[item.id] || undefined }}
          >
            <span className="font-medium">{index + 1}. {item.title}</span>
            <span className="text-muted-foreground">{item.durationMinutes} mins</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={commencePreparedSchedule} className="flex-1">
          <Play className="mr-2 h-4 w-4" /> Commence
        </Button>
        <Button variant="outline" size="icon" onClick={resetSchedule} aria-label="Discard schedule">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UpcomingScheduleCardContent;