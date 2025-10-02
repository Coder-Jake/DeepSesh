import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Share2 } from "lucide-react"; // Import Share2
import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext"; // Import DAYS_OF_WEEK
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components

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

  const getScheduleSummary = (schedule: ScheduledTimer[]) => {
    if (schedule.length === 0) return "No timers";
    const totalDuration = schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
    return `${schedule.length} timers, ${totalDuration} min`;
  };

  const getCommenceInfo = (template: ScheduledTimerTemplate) => {
    if (template.scheduleStartOption === 'now') {
      return "Starts: Now";
    } else if (template.scheduleStartOption === 'manual') {
      return "Starts: Manual";
    } else {
      if (template.commenceDay === null) {
        return "Starts: Today (default)"; // Display for null commenceDay
      }
      const dayName = DAYS_OF_WEEK[template.commenceDay];
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
      <CardContent className="pt-2 relative"> {/* Added relative for absolute positioning */}
        {template.scheduleStartOption === 'custom_time' && ( // Conditionally render based on scheduleStartOption
          <p className="text-sm text-gray-600 mb-3">{getCommenceInfo(template)}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleLoad}>
            <Play className="h-4 w-4 mr-2" /> Load
          </Button>
        </div>

        {/* Share Icon and Dropdown */}
        <div className="absolute bottom-2 left-2"> {/* Positioned to bottom-left */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6 text-primary hover:bg-muted" // Tiny and dark blue (using primary color)
              >
                <Share2 className="h-4 w-4" /> {/* Tiny icon */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start"> {/* Align to start so it opens rightwards */}
              <DropdownMenuItem onClick={() => console.log('Share Link for template', template.id)}>Link</DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Share QR for template', template.id)}>QR</DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Share NFC for template', template.id)}>NFC</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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