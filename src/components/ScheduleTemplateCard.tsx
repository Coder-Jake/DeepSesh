import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2 } from "lucide-react";
import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer"; // Added ScheduledTimer to imports
import { useTimer } from "@/contexts/TimerContext";

interface ScheduleTemplateCardProps {
  template: ScheduledTimerTemplate;
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplateCard: React.FC<ScheduleTemplateCardProps> = ({ template, setActiveTab }) => {
  const { loadScheduleTemplate, deleteScheduleTemplate } = useTimer();

  const handleLoad = () => {
    loadScheduleTemplate(template.id);
    setActiveTab('plan'); // Switch back to plan tab after loading
  };

  const handleDelete = () => {
    deleteScheduleTemplate(template.id);
  };

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const getScheduleSummary = (schedule: ScheduledTimer[]) => {
    if (schedule.length === 0) return "No timers";
    const totalDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
    return `${schedule.length} timers, ${totalDuration} min total`;
  };

  const getCommenceInfo = (template: ScheduledTimerTemplate) => {
    if (template.scheduleStartOption === 'now') {
      return "Starts: Now";
    } else if (template.scheduleStartOption === 'manual') {
      return "Starts: Manual";
    } else {
      const dayName = daysOfWeek[template.commenceDay];
      return `Starts: ${template.commenceTime} on ${dayName}`;
    }
  };

  return (
    <Card className="flex flex-col justify-between relative">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{template.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {getScheduleSummary(template.schedule)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-gray-600 mb-3">{getCommenceInfo(template)}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleLoad}>
            <Play className="h-4 w-4 mr-2" /> Load
          </Button>
        </div>
      </CardContent>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleDelete} 
        className="absolute top-0 right-0"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </Card>
  );
};

export default ScheduleTemplateCard;