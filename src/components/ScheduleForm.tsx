import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X, Clock } from "lucide-react"; // ADD Clock icon
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleTemplates from './ScheduleTemplates';

// Utility function to get the current time in HH:MM format
// REMOVED from here, now in TimerContext.tsx

const ScheduleForm: React.FC = () => {
  const { 
    schedule,
    setSchedule, 
    setIsSchedulingMode, 
    startSchedule, 
    scheduleTitle, 
    setScheduleTitle, 
    commenceTime, 
    setCommenceTime, 
    commenceDay, 
    setCommenceDay,
    scheduleStartOption, // NEW
    setScheduleStartOption, // NEW
    timerIncrement,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    isSchedulePending,
  } = useTimer();
  const { toast } = useToast();

  // REMOVED: const [isCommenceTimeAdjusted, setIsCommenceTimeAdjusted] = useState(false);

  // Initialize schedule if it's empty (e.g., first time opening schedule form)
  useEffect(() => {
    if (schedule.length === 0) {
      setSchedule([
        { id: crypto.randomUUID(), title: "Beginning", type: "focus", durationMinutes: 25, isCustom: false },
        { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
        { id: crypto.randomUUID(), title: "Middle", type: "focus", durationMinutes: 60, isCustom: false },
        { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 30, isCustom: false },
        { id: crypto.randomUUID(), title: "End", type: "focus", durationMinutes: 45, isCustom: false },
        { id: crypto.randomUUID(), title: "Networking", type: "break", durationMinutes: 15, isCustom: false },
      ]);
    }
  }, [schedule, setSchedule]);

  const [activeTab, setActiveTab] = useState("plan");

  const [isEditingScheduleTitle, setIsEditingScheduleTitle] = useState(false);
  const scheduleTitleInputRef = useRef<HTMLInputElement>(null);

  const [editingCustomTitleId, setEditingCustomTitleId] = useState<string | null>(null);
  const [tempCustomTitle, setTempCustomTitle] = useState<string>("");
  const customTitleInputRef = useRef<HTMLInputElement>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const daysOfWeek = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  const currentDayIndex = new Date().getDay(); // Get current day index

  // REMOVED: Effect to keep commenceTime and commenceDay live until adjusted by the user
  // This logic is now handled in TimerContext.tsx based on scheduleStartOption

  useEffect(() => {
    if (isEditingScheduleTitle && scheduleTitleInputRef.current) {
      scheduleTitleInputRef.current.focus();
      scheduleTitleInputRef.current.select();
    }
  }, [isEditingScheduleTitle]);

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
        setScheduleTitle("My Schedule");
      }
    }
  };

  const handleScheduleTitleInputBlur = () => {
    setIsEditingScheduleTitle(false);
    if (scheduleTitle.trim() === "") {
      setScheduleTitle("My Schedule");
    }
  };

  const handleAddTimer = () => {
    setSchedule(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: "New Timer", type: "focus", durationMinutes: timerIncrement, isCustom: false }
    ]);
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setSchedule(prev =>
      prev.map(timer => {
        if (timer.id === id) {
          if (field === 'customTitle') {
            return { ...timer, [field]: value, isCustom: value.trim() !== "" };
          } else if (field === 'type') {
            return { ...timer, [field]: value, customTitle: undefined, isCustom: false };
          }
          return { ...timer, [field]: value };
        }
        return timer;
      })
    );
  };

  const handleRemoveTimer = (id: string) => {
    setSchedule(prev => prev.filter(timer => timer.id !== id));
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
    if (schedule.length === 0) {
      toast({
        title: "No Timers in Schedule",
        description: "Please add at least one timer to your schedule.",
        variant: "destructive",
      });
      return;
    }
    if (schedule.some(timer => timer.durationMinutes <= 0)) {
      toast({
        title: "Invalid Duration",
        description: "All timers must have a duration greater than 0 minutes.",
        variant: "destructive",
      });
      return;
    }

    startSchedule();
  };

  const handleLongPressStart = (timer: ScheduledTimer) => {
    isLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPress.current = true;
      setEditingCustomTitleId(timer.id);
      setTempCustomTitle(timer.customTitle || (timer.type === 'focus' ? 'Focus' : 'Break'));
    }, 500);
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

  const buttonText = isSchedulePending 
    ? "Pending..." 
    : (scheduleStartOption === 'now' ? "Begin" : "Prepare");

  return (
    <Card className="px-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 px-4 lg:px-6">
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <CardHeader className="flex flex-row items-center justify-between py-4 px-4 lg:px-6">
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
        <TabsContent value="plan" className="pt-6 pb-6 space-y-6 px-4 lg:px-6">
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {schedule.map((timer, index) => (
              <div key={timer.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2 flex-grow">
                  <span className="font-semibold text-sm text-gray-500 flex-shrink-0 self-start">{index + 1}.</span>
                  <Input
                    placeholder="Timer Title"
                    value={timer.title}
                    onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                    className="flex-grow min-w-0"
                    onFocus={(e) => e.target.select()}
                  />
                </div>
                
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
                
                <Button variant="ghost" size="icon" onClick={() => handleRemoveTimer(timer.id)} className="ml-auto flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleAddTimer} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Timer
          </Button>

          <div className="flex gap-2 mt-4"> {/* NEW CONTAINER FOR BUTTONS */}
            <Button
              variant={scheduleStartOption === 'now' ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('now')}
            >
              Now
            </Button>
            <Button
              variant={scheduleStartOption === 'manual' ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('manual')}
            >
              Manual
            </Button>
            <Button
              variant={scheduleStartOption === 'custom_time' ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('custom_time')}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>

          {scheduleStartOption === 'custom_time' && ( // CONDITIONAL RENDERING
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="commence-time">Commence Time</Label>
                <Input
                  id="commence-time"
                  type="time"
                  value={commenceTime}
                  onChange={(e) => {
                    setCommenceTime(e.target.value);
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commence-day">Commence Day</Label>
                <Select value={commenceDay.toString()} onValueChange={(value) => {
                  setCommenceDay(parseInt(value));
                }}>
                  <SelectTrigger id="commence-day">
                    <SelectValue>
                      {commenceDay === currentDayIndex ? "Today" : daysOfWeek[commenceDay]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, index) => (
                      <SelectItem key={day} value={index.toString()}>
                        {index === currentDayIndex ? "Today" : day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button onClick={handleCommenceSchedule} className="w-full h-12 text-lg" disabled={isSchedulePending}>
            <Play className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        </TabsContent>
        <TabsContent value="saved" className="pt-6 pb-6 space-y-6 px-4 lg:px-6">
          <ScheduleTemplates setActiveTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ScheduleForm;