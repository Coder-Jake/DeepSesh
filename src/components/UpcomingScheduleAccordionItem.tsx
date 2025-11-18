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
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      
      // Defensive check for Invalid Date object after initial creation
      if (isNaN(targetDate.getTime())) {
        console.error("Invalid targetDate created from commenceTime:", template.commenceTime, "Resulting Date:", targetDate);
        return "Invalid Date";
      }

      const currentDay = now.getDay();
      const templateDay = template.commenceDay === null || template.commenceDay === undefined ? currentDay : template.commenceDay;
      const daysToAdd = (templateDay - currentDay + 7) % 7;
      targetDate.setDate(now.getDate() + daysToAdd);

      // If the target time is in the past for today, set it for next week
      if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
        targetDate.setDate(targetDate.getDate() + 7);
      }

      const isToday = targetDate.toDateString() === now.toDateString();
      const isTomorrow = targetDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      const dayDisplay = isToday ? "Today" : (isTomorrow ? "Tomorrow" : DAYS_OF_WEEK[targetDate.getDay()]);

      return `${formattedTime} ${dayDisplay}`;
    }
    return ""; // Should not happen for 'now' option in prepared schedules
  }, [template.commenceTime, template.commenceDay, template.scheduleStartOption, is24HourFormat]);

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
            className="h-8 px-3 text-xs flex items-center gap-1"
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
          commencePreparedSchedule={() => commencePreparedSchedule(template.id)}
          resetSchedule={() => discardPreparedSchedule(template.id)}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default UpcomingScheduleAccordionItem;