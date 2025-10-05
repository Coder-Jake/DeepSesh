import React, { useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Clock, CalendarDays, ListTodo } from "lucide-react";
import { ScheduledTimer, ScheduledTimerTemplate } from "@/types/timer";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";

interface UpcomingScheduleCardProps {
  schedule: ScheduledTimer[];
  scheduleTitle: string;
  commenceTime: string;
  commenceDay: number | null;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  activeTimerColors: Record<string, string>;
  commencePreparedSchedule: () => void;
  resetSchedule: () => void;
}

const UpcomingScheduleCard: React.FC<UpcomingScheduleCardProps> = ({
  schedule,
  scheduleTitle,
  commenceTime,
  commenceDay,
  scheduleStartOption,
  activeTimerColors,
  commencePreparedSchedule,
  resetSchedule,
}) => {
  const { formatTime, is24HourFormat } = useTimer();

  const totalDurationMinutes = useMemo(() => {
    return schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
  }, [schedule]);

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
    return ""; // Should not happen for 'prepared' schedules
  }, [commenceTime, commenceDay, scheduleStartOption, is24HourFormat]);

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          {scheduleTitle}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {getCommenceInfo()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-1 pr-2"> {/* Removed max-h-40 and overflow-y-auto */}
          {schedule.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md text-sm",
                item.type === 'focus' ? "bg-[hsl(var(--focus-background))]" : "bg-[hsl(var(--break-background))]"
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
          <Button variant="outline" onClick={resetSchedule} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" /> Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingScheduleCard;