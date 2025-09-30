import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Import cn for conditional styling

const ScheduleForm: React.FC = () => {
  const { 
    setSchedule, 
    setIsSchedulingMode, 
    startSchedule, 
    scheduleTitle, 
    setScheduleTitle, 
    commenceTime, 
    setCommenceTime, 
    commenceDay, 
    setCommenceDay 
  } = useTimer();
  const { toast } = useToast();

  const [localSchedule, setLocalSchedule] = useState<ScheduledTimer[]>([
    { id: crypto.randomUUID(), title: "Beginning", type: "focus", durationMinutes: 25 },
    { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5 },
    { id: crypto.randomUUID(), title: "Middle", type: "focus", durationMinutes: 60 },
    { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 30 },
    { id: crypto.randomUUID(), title: "End", type: "focus", durationMinutes: 45 },
    { id: crypto.randomUUID(), title: "Networking", type: "break", durationMinutes: 15 },
  ]);
  const [isStartTimeNow, setIsStartTimeNow] = useState(true); // New state for 'Start Time' toggle

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const handleAddTimer = () => {
    setLocalSchedule(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: "New Timer", type: "focus", durationMinutes: 25 }
    ]);
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setLocalSchedule(prev =>
      prev.map(timer =>
        timer.id === id ? { ...timer, [field]: value } : timer
      )
    );
  };

  const handleRemoveTimer = (id: string) => {
    setLocalSchedule(prev => prev.filter(timer => timer.id !== id));
  };

  const handleCommenceSchedule = () => {
    if (!scheduleTitle.trim()) {
      toast({
        title: "Schedule Title Missing",
        description: "Please enter a title for your schedule.",
        variant: "destructive",
      });
      return;
    }
    if (localSchedule.length === 0) {
      toast({
        title: "No Timers in Schedule",
        description: "Please add at least one timer to your schedule.",
        variant: "destructive",
      });
      return;
    }
    if (localSchedule.some(timer => timer.durationMinutes <= 0)) {
      toast({
        title: "Invalid Duration",
        description: "All timers must have a duration greater than 0 minutes.",
        variant: "destructive",
      });
      return;
    }
    setSchedule(localSchedule);
    startSchedule();
  };

  return (
    <Card className="py-6 px-0"> {/* Removed horizontal padding from the main Card */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-4 lg:px-6"> {/* Added responsive horizontal padding */}
        <Input
          placeholder="Schedule Title"
          value={scheduleTitle}
          onChange={(e) => setScheduleTitle(e.target.value)}
          className="text-2xl font-bold h-auto py-2"
        />
        <Button variant="ghost" size="icon" onClick={() => setIsSchedulingMode(false)}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6 px-4 lg:px-6"> {/* Added responsive horizontal padding */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {localSchedule.map((timer, index) => (
            <div key={timer.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/50">
              <div className="flex items-center gap-2 flex-grow"> {/* Group number and title, allow to grow */}
                <span className="font-semibold text-lg text-primary flex-shrink-0">{index + 1}.</span>
                <Input
                  placeholder="Timer Title"
                  value={timer.title}
                  onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                  className="flex-grow min-w-0" // Allow title to take available space, but can shrink
                />
              </div>
              
              <div className="flex items-center gap-3 flex-shrink-0"> {/* Group duration, type, trash */}
                <Input
                  type="number"
                  placeholder="Min"
                  value={timer.durationMinutes}
                  onChange={(e) => handleUpdateTimer(timer.id, 'durationMinutes', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-20 text-center"
                />
                
                <Button
                  variant="ghost"
                  className={cn(
                    "w-24 h-10 text-sm font-medium",
                    timer.type === 'focus' ? "text-public-bg-foreground bg-public-bg hover:bg-public-bg/80" : "text-private-bg-foreground bg-private-bg hover:bg-private-bg/80"
                  )}
                  onClick={() => handleUpdateTimer(timer.id, 'type', timer.type === 'focus' ? 'break' : 'focus')}
                >
                  {timer.type === 'focus' ? 'Focus' : 'Break'}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={() => handleRemoveTimer(timer.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleAddTimer} variant="outline" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Timer
        </Button>

        {/* Start Time Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="start-time-toggle">Start Time</Label>
            <p className="text-sm text-muted-foreground">
              {isStartTimeNow ? 'Now' : 'Later'}
            </p>
          </div>
          <Switch
            id="start-time-toggle"
            checked={!isStartTimeNow} // Checked means 'Later'
            onCheckedChange={(checked) => setIsStartTimeNow(!checked)}
          />
        </div>

        {/* Commencement Time and Day Selection (conditionally rendered) */}
        {!isStartTimeNow && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                id="commence-time"
                type="time"
                value={commenceTime}
                onChange={(e) => setCommenceTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Select value={commenceDay.toString()} onValueChange={(value) => setCommenceDay(parseInt(value))}>
                <SelectTrigger id="commence-day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day, index) => (
                    <SelectItem key={day} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button onClick={handleCommenceSchedule} className="w-full h-12 text-lg">
          <Play className="mr-2 h-5 w-5" />Commence
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScheduleForm;