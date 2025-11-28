import React, { useCallback, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Play, ListTodo } from "lucide-react";
import { ScheduledTimerTemplate } from "@/types/timer";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";
import UpcomingScheduleCardContent from './UpcomingScheduleCard'; // Import the modified content component
import { DAYS_OF_WEEK } from "@/lib/constants"; // Corrected import

interface UpcomingScheduleAccordionItemProps {
  template: ScheduledTimerTemplate;
  commencePreparedSchedule: (templateId: string) => void;
  discardPreparedSchedule: (templateId: string) => void;
  showCommenceButton: boolean; // New prop to control button visibility
}

const UpcomingScheduleAccordionItem: React.FC<UpcomingScheduleAccordionItemProps> = ({
  template,
  commencePreparedSchedule,
  discardPreparedSchedule,
  showCommenceButton,
}) => {
  const { formatTime, is24HourFormat } = useTimer();

  const getCommenceInfo = useCallback(() => {
    if (template.scheduleStartOption === 'manual') {
      return "Manual Start";
    } else if (template.scheduleStartOption === 'custom_time') {
      const timeParts = template.commenceTime.split(':').map(Number);
      const hours = timeParts[0];
      const minutes = timeParts[1];

      // Defensive check for NaN or undefined hours/minutes
      if (isNaN(hours) || isNaN(minutes) || hours === undefined || minutes === undefined) {
        console.error("Invalid commenceTime format:", template.commenceTime);
        return "Invalid Time";
      }

      const formattedTime = new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: is24HourFormat ? 'h23' : 'h12'
      });
      const now = new Date();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      
      // Defensive check for Invalid Date object after initial creation
      if (isNaN(targetDate.getTime())) {
        console.error("Invalid targetDate created from commenceTime:", template.commenceTime, "Resulting Date:", targetDate);
        return "Invalid Date";
      }

      const currentDay = now.getDay();
      const templateDay = template.commenceDay === null || template.commenceDay === undefined ? currentDay : template.commenceDay;
      const daysToAdd = (templateDay - currentDay + 7) % 7;
      targetDate.setDate(now.getDate() + daysToAdd);

      // Calculate total duration of the schedule
      let totalScheduleDurationSeconds = 0;
      template.schedule.forEach(item => {
        totalScheduleDurationSeconds += item.durationMinutes * 60;
      });

      // If the target time is in the past
      if (targetDate.getTime() < now.getTime()) {
        if (!template.isRecurring) {
          // For non-recurring schedules, check if the entire schedule duration has passed
          const elapsedSecondsSinceScheduledStart = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
          if (elapsedSecondsSinceScheduledStart >= totalScheduleDurationSeconds) {
            // Schedule is fully in the past and completed, so it's not "upcoming"
            return "Completed"; // Or some other indicator
          } else {
            // Schedule is in the past but still "in progress", display as "Started"
            return "Started";
          }
        } else {
          // For recurring schedules, advance to the next occurrence
          let nextCommenceDate = new Date(targetDate);
          while (nextCommenceDate.getTime() < now.getTime()) {
            if (template.recurrenceFrequency === 'daily') {
              nextCommenceDate.setDate(nextCommenceDate.getDate() + 1);
            } else if (template.recurrenceFrequency === 'weekly') {
              nextCommenceDate.setDate(nextCommenceDate.getDate() + 7);
            } else if (template.recurrenceFrequency === 'monthly') {
              nextCommenceDate.setMonth(nextCommenceDate.getMonth() + 1);
            } else {
              return "Invalid Recurrence";
            }
          }
          targetDate = nextCommenceDate; // Use the next occurrence for display
        }
      }

      const isToday = targetDate.toDateString() === now.toDateString();
      const isTomorrow = targetDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      const dayDisplay = isToday ? "Today" : (isTomorrow ? "Tomorrow" : DAYS_OF_WEEK[targetDate.getDay()]);

      return `${formattedTime} ${dayDisplay}`;
    }
    return ""; // Should not happen for 'now' option in prepared schedules
  }, [template.commenceTime, template.commenceDay, template.scheduleStartOption, is24HourFormat, template.isRecurring, template.recurrenceFrequency, template.schedule]);

  return (
    <AccordionItem value={template.id} className="border rounded-lg px-4">
      <AccordionTrigger className="flex items-center justify-between py-3 text-base font-medium no-underline">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          <span className="font-semibold">{template.title}</span>
          <span className="text-sm text-muted-foreground ml-2">{getCommenceInfo()}</span>
        </div>
        {showCommenceButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent accordion from toggling
              commencePreparedSchedule(template.id);
            }}
            className="h-8 px-3 text-xs flex items-center gap-1 hover:bg-accent-hover" // NEW: Added hover effect
          >
            <Play className="h-3 w-3" /> Commence
          </Button>
        )}
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        <UpcomingScheduleCardContent
          schedule={template.schedule}
          commenceTime={template.commenceTime}
          commenceDay={template.commenceDay}
          scheduleStartOption={template.scheduleStartOption}
          activeTimerColors={template.timerColors}
          commencePreparedSchedule={() => commenceSpecificPreparedSchedule(template.id)}
          resetSchedule={() => discardPreparedSchedule(template.id)}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default UpcomingScheduleAccordionItem;