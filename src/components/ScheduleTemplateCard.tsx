import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Share2 } from "lucide-react";
import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer";
import { useTimer } from "@/contexts/TimerContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { toast } from 'sonner'; // Changed to sonner toast

interface ScheduleTemplateCardProps {
  template: ScheduledTimerTemplate;
  setActiveTab: (tab: string) => void;
}

const ScheduleTemplateCard: React.FC<ScheduleTemplateCardProps> = ({ template, setActiveTab }) => {
  const { loadScheduleTemplate, deleteScheduleTemplate, areToastsEnabled } = useTimer(); // NEW: Get areToastsEnabled

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

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/schedule/${template.id}`; // Example share URL
    navigator.clipboard.writeText(shareUrl).then(() => {
      if (areToastsEnabled) { // NEW: Conditional toast
        toast.success("Link copied!", {
          description: "The schedule link has been copied to your clipboard.",
        });
      }
    }).catch(err => {
      console.error("Failed to copy link:", err);
      if (areToastsEnabled) { // NEW: Conditional toast
        toast.error("Failed to copy link", {
          description: "Please try again.",
        });
      }
    });
  };

  return (
    <Card className="flex flex-col justify-between relative">
      <CardHeader className="py-2">
        <CardTitle className="text-lg">{template.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {getScheduleSummary(template.schedule)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 relative">
        {template.scheduleStartOption === 'custom_time' && (
          <p className="text-sm text-gray-600 mb-3">{getCommenceInfo(template)}</p>
        )}
        
        <div className="absolute bottom-2 left-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 hover:bg-muted"
              >
                <Share2 className="h-4 w-4 text-foreground hover:text-blue-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleShareLink}>Link</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (areToastsEnabled) toast.info("QR sharing not implemented yet."); }}>QR</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (areToastsEnabled) toast.info("NFC sharing not implemented yet."); }}>NFC</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button 
          variant="outline" 
          size="icon"
          onClick={handleLoad}
          className="absolute bottom-2 right-2"
        >
          <Play className="h-4 w-4 text-green-700" />
        </Button>
      </CardContent>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute top-0 right-0"
      >
        <Trash2 className="h-3 w-3 text-foreground hover:text-red-700" />
      </Button>
    </Card>
  );
};

export default ScheduleTemplateCard;