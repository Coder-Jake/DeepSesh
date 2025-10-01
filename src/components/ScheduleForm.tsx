import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X } from "lucide-react";
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Import cn for conditional styling
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import ScheduleTemplates from './ScheduleTemplates'; // Import the new component

// Utility function to get the next 30-minute increment
const getNextHalfHourIncrement = () => {
  const now = new Date();
  let minutes = now.getMinutes();
  let hours = now.getHours();

  if (minutes < 30) {
    minutes = 30;
  } else {
    minutes = 0;
    hours = (hours + 1) % 24;
  }

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHours}:${formattedMinutes}`;
};

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
    setCommenceDay,
    timerIncrement,
    isRecurring, // New: Get isRecurring from context
    setIsRecurring, // New: Get setIsRecurring from context
    recurrenceFrequency, // New: Get recurrenceFrequency from context
    setRecurrenceFrequency // New: Get setRecurrenceFrequency from context
  } = useTimer();
  const { toast } = useToast();

  const [localSchedule, setLocalSchedule] = useState<ScheduledTimer[]>([
    { id: crypto.randomUUID(), title: "Beginning", type: "focus", durationMinutes: 25, isCustom: false },
    { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
    { id: crypto.randomUUID(), title: "Middle", type: "focus", durationMinutes: 60, isCustom: false },
    { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 30, isCustom: false },
    { id: crypto.randomUUID(), title: "End", type: "focus", durationMinutes: 45, isCustom: false },
    { id: crypto.randomUUID(), title: "Networking", type: "break", durationMinutes: 15, isCustom: false },
  ]);
  const [isStartTimeNow, setIsStartTimeNow] = useState(true); // State for 'Start Time' toggle
  const [activeTab, setActiveTab] = useState("new"); // State for active tab

  // New state and ref for editable schedule title
  const [isEditingScheduleTitle, setIsEditingScheduleTitle] = useState(false);
  const scheduleTitleInputRef = useRef<HTMLInputElement>(null);

  // New states for editing custom timer type text
  const [editingCustomTitleId, setEditingCustomTitleId] = useState<string | null>(null);
  const [tempCustomTitle, setTempCustomTitle] = useState<string>("");
  const customTitleInputRef = useRef<HTMLInputElement>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  // Initialize commenceTime and commenceDay to the next 30-minute increment and current day
  React.useEffect(() => {
    setCommenceTime(getNextHalfHourIncrement());
    setCommenceDay(new Date().getDay());
  }, [setCommenceTime, setCommenceDay]);

  // Effect to focus the input when isEditingScheduleTitle becomes true
  useEffect(() => {
    if (isEditingScheduleTitle && scheduleTitleInputRef.current) {
      scheduleTitleInputRef.current.focus();
      scheduleTitleInputRef.current.select(); // Select the text when focused
    }
  }, [isEditingScheduleTitle]);

  // Effect to focus the custom title input when editing starts
  useEffect(() => {
    if (editingCustomTitleId && customTitleInputRef.current) {
      customTitleInputRef.current.focus();
      customTitleInputRef.current.select();
    }
  }, [editingCustomTitleId]);

  const handleScheduleTitleClick = () => {
    setIsEditingScheduleTitle(true);
  };

  const handleScheduleTitleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingScheduleTitle(false);
      e.currentTarget.blur();
      if (scheduleTitle.trim() === "") {
        setScheduleTitle("My Schedule"); // Revert to default if empty
      }
    }
  };

  const handleScheduleTitleInputBlur = () => {
    setIsEditingScheduleTitle(false);
    if (scheduleTitle.trim() === "") {
      setScheduleTitle("My Schedule"); // Revert to default if empty
    }
  };

  const handleAddTimer = () => {
    setLocalSchedule(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: "New Timer", type: "focus", durationMinutes: timerIncrement, isCustom: false } // Default to timerIncrement
    ]);
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setLocalSchedule(prev =>
      prev.map(timer => {
        if (timer.id === id) {
          if (field === 'customTitle') {
            // If customTitle is being set, also set isCustom to true
            return { ...timer, [field]: value, isCustom: value.trim() !== "" };
          } else if (field === 'type') {
            // If type is changed back to focus/break, clear custom title and set isCustom to false
            return { ...timer, [field]: value, customTitle: undefined, isCustom: false };
          }
          return { ...timer, [field]: value };
        }
        return timer;
      })
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

  // Long press handlers for custom type buttons
  const handleLongPressStart = (timer: ScheduledTimer) => {
    isLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPress.current = true;
      setEditingCustomTitleId(timer.id);
      setTempCustomTitle(timer.customTitle || (timer.type === 'focus' ? 'Focus' : 'Break'));
    }, 500); // 500ms for long press
  };

  const handleLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
  };

  const handleCustomTitleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, timerId: string) => {
    if (e.key === 'Enter') {
      handleUpdateTimer(timerId, 'customTitle', tempCustomTitle);
      setEditingCustomTitleId(null);
      e.currentTarget.blur();
    }
  };

  const handleCustomTitleInputBlur = (timerId: string) => {
    handleUpdateTimer(timerId, 'customTitle', tempCustomTitle);
    setEditingCustomTitleId(null);
  };

  const handleTypeButtonClick = (timer: ScheduledTimer) => {
    if (!isLongPress.current) {
      handleUpdateTimer(timer.id, 'type', timer.type === 'focus' ? 'break' : 'focus');
    }
  };

  return (
    <Card className="py-6 px-0"> {/* Removed horizontal padding from the main Card */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 px-4 lg:px-6"> {/* Added responsive horizontal padding */}
        {isEditingScheduleTitle ? (
          <Input
            ref={scheduleTitleInputRef}
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            onKeyDown={handleScheduleTitleInputKeyDown}
            onBlur={handleScheduleTitleInputBlur}
            placeholder="Schedule Title"
            className="text-2xl font-bold h-auto py-2"
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <CardTitle
            className="text-2xl font-bold h-auto py-2 cursor-pointer select-none"
            onClick={handleScheduleTitleClick}
          >
            {scheduleTitle || "My Schedule"}
          </CardTitle>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsSchedulingMode(false)}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      {/* Moved Tabs component here, applying padding directly to its children */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 px-4 lg:px-6">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-6 space-y-6 px-4 lg:px-6">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {localSchedule.map((timer, index) => (
              <div key={timer.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/50"> {/* Removed justify-between here */}
                <div className="flex items-center gap-2 flex-grow"> {/* Group number and title, allow to grow */}
                  <span className="font-semibold text-sm text-gray-500 flex-shrink-0 self-start">{index + 1}.</span> {/* Changed text-primary to text-gray-500 */}
                  <Input
                    placeholder="Timer Title"
                    value={timer.title}
                    onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                    className="flex-grow min-w-0" // Allow title to take available space, but can shrink
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                
                {/* Duration and Type buttons */}
                <Input
                  type="number"
                  placeholder="Min"
                  value={timer.durationMinutes === 0 ? "" : timer.durationMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleUpdateTimer(timer.id, 'durationMinutes', 0);
                    } else {
                      handleUpdateTimer(timer.id, 'durationMinutes', parseFloat(value) || 0);
                    }
                  }}
                  onBlur={() => {
                    if (timer.durationMinutes === 0) {
                      handleUpdateTimer(timer.id, 'durationMinutes', timerIncrement);
                    }
                  }}
                  min={timerIncrement}
                  step={timerIncrement}
                  className="w-20 text-center flex-shrink-0"
                  onFocus={(e) => e.target.select()}
                />
                
                {editingCustomTitleId === timer.id ? (
                  <Input
                    ref={customTitleInputRef}
                    value={tempCustomTitle}
                    onChange={(e) => setTempCustomTitle(e.target.value)}
                    onKeyDown={(e) => handleCustomTitleInputKeyDown(e, timer.id)}
                    onBlur={() => handleCustomTitleInputBlur(timer.id)}
                    className="w-24 h-10 text-sm font-medium flex-shrink-0 text-center"
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-24 h-10 text-sm font-medium flex-shrink-0",
                      timer.isCustom ? "bg-blue-200 text-blue-800 hover:bg-blue-300" :
                      timer.type === 'focus' ? "text-public-bg-foreground bg-public-bg hover:bg-public-bg/80" : "text-private-bg-foreground bg-private-bg hover:bg-private-bg/80"
                    )}
                    onMouseDown={() => handleLongPressStart(timer)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(timer)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={() => handleTypeButtonClick(timer)}
                  >
                    {timer.customTitle || (timer.type === 'focus' ? 'Focus' : 'Break')}
                  </Button>
                )}
                
                {/* Trash button, pushed to the far right */}
                <Button variant="ghost" size="icon" onClick={() => handleRemoveTimer(timer.id)} className="ml-auto flex-shrink-0"> {/* Added ml-auto */}
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleAddTimer} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Timer
          </Button>

          {/* Commencement Time and Day Selection (conditionally rendered) */}
          {!isStartTimeNow && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  id="commence-time"
                  type="time"
                  value={commenceTime}
                  onChange={(e) => setCommenceTime(e.target.value)}
                  onFocus={(e) => e.target.select()}
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
        </TabsContent>
        <TabsContent value="saved" className="mt-6 px-4 lg:px-6">
          <ScheduleTemplates />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ScheduleForm;