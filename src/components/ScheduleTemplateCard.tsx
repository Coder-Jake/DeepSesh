import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Share2 } from "lucide-react";
import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ScheduleTemplateCardProps {
  template: ScheduledTimerTemplate;
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplateCard: React.FC<ScheduleTemplateCardProps> = ({ template, setActiveTab }) => {
  const { loadScheduleTemplate, deleteScheduleTemplate } = useTimer();

  const handleLoad = () => {
    loadScheduleTemplate(template.id);
    setActiveTab('plan');
  };

  const handleDelete = () => {
    deleteScheduleTemplate(template.id);
  };

  const getScheduleSummary = (schedule: ScheduledTimer[]) => {
    if (schedule.length === 0) return "No timers";
    const totalDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
    return (
      <>
        {schedule.length} timers,
        <br />
        {totalDuration} min
      </>
    );
  };

  const getCommenceInfo = (template: ScheduledTimerTemplate) => {
    if (template.scheduleStartOption === 'now') {
      return "Starts: Now";
    } else if (template.scheduleStartOption === 'manual') {
      return "Starts: Manual";
    } else {
      if (template.commenceDay === null) {
        return "Starts: Today (default)";
      }
      const dayName = DAYS_OF_WEEK[template.commenceDay];
      return `Starts: ${template.commenceTime} on ${dayName}`;
    }
  };

  return (
    <Card className="flex flex-col justify-between relative">
      <CardHeader className="py-2"> {/* Changed from pb-2 to py-2 */}
        <CardTitle className="text-lg">{template.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {getScheduleSummary(template.schedule)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 relative">
        {template.scheduleStartOption === 'custom_time' && (
          <p className="text-sm text-gray-600 mb-3">{getCommenceInfo(template)}</p>
        )}
        
        {/* Share button */}
        <div className="absolute bottom-2 left-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 text-primary hover:bg-muted"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => console.log('Share Link for template', template.id)}>Link</DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Share QR for template', template.id)}>QR</DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Share NFC for template', template.id)}>NFC</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Load button moved to bottom right */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLoad}
          className="absolute bottom-2 right-2"
        >
          <Play className="h-4 w-4 mr-2" /> Load
        </Button>
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