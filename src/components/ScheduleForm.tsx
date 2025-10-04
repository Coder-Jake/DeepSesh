import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X, Clock, Save } from "lucide-react";
import { useTimer, DAYS_OF_WEEK } from "@/contexts/TimerContext"; // Import DAYS_OF_WEEK
import { ScheduledTimer } from "@/types/timer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleTemplates from './ScheduleTemplates';
import ColorPicker from './ColorPicker'; // Import the new ColorPicker component

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
    scheduleStartOption, 
    setScheduleStartOption, 
    timerIncrement,
    isRecurring, // Now exists on TimerContextType
    setIsRecurring, // Now exists on TimerContextType
    recurrenceFrequency, // Now exists on TimerContextType
    setRecurrenceFrequency, // Now exists on TimerContextType
    isSchedulePending,
    isSchedulePrepared, // NEW
    saveCurrentScheduleAsTemplate, // Now exists on TimerContextType
    isRunning, // Added for confirmation check
    isPaused, // Added for confirmation check
    isScheduleActive, // Added for confirmation check
    resetSchedule, // Added for confirmation check
    timerColors, // NEW: Get from context
    setTimerColors, // NEW: Get from context
  } = useTimer();
  const { toast } = useToast();

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
  const [isSaveButtonBlue, setIsSaveButtonBlue] = useState(false);

  // New state for color picker
  const [editingColorTimerId, setEditingColorTimerId] = useState<string | null>(null);
  // Removed local timerColors state, now using context

  // Order for displaying days in the Select component (Monday first, Sunday last)
  const daysOfWeekDisplayOrder = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Map display day name to its Date.getDay() index (0 for Sunday, 1 for Monday, etc.)
  const getDayIndexForDisplayDay = (displayDay: string): number => {
    switch (displayDay) {
      case "Monday": return 1;
      case "Tuesday": return 2;
      case "Wednesday": return 3;
      case "Thursday": return 4;
      case "Friday": return 5;
      case "Saturday": return 6;
      case "Sunday": return 0;
      default: return -1; // Should not happen
    }
  };

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

  const handleEnterKeyNavigation = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission or button click

      const activeElement = document.activeElement as HTMLElement;
      const inputType = activeElement.dataset.inputType; // Get the custom data attribute

      if (inputType) {
        const formElement = document.getElementById('plan-tab-content');
        if (!formElement) return;

        // Find all elements of the same inputType within the form
        const sameTypeElements = Array.from(
          formElement.querySelectorAll<HTMLElement>(`[data-input-type="${inputType}"]`)
        ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0); // Filter out hidden elements

        const currentIndex = sameTypeElements.indexOf(activeElement);
        if (currentIndex > -1 && currentIndex < sameTypeElements.length - 1) {
          sameTypeElements[currentIndex + 1].focus();
        } else if (currentIndex === sameTypeElements.length - 1) {
          // If it's the last element of its type, blur it
          activeElement.blur();
        }
      } else {
        // If it's a button or other element without data-input-type,
        // let it perform its default action or just blur.
        activeElement.blur();
      }
    }
  }, []);

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
      handleEnterKeyNavigation(e); // Call navigation after handling local logic
    }
  };

  const handleScheduleTitleInputBlur = () => {
    setIsEditingScheduleTitle(false);
    if (scheduleTitle.trim() === "") {
      setScheduleTitle("My Schedule");
    }
  };

  const handleAddTimer = () => {
    setSchedule((prev: ScheduledTimer[]) => [
      ...prev,
      { id: crypto.randomUUID(), title: "New Timer", type: "focus", durationMinutes: timerIncrement, isCustom: false } as ScheduledTimer // Explicitly cast
    ]);
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setSchedule((prev: ScheduledTimer[]) =>
      prev.map(timer => {
        if (timer.id === id) {
          if (field === 'customTitle') {
            return { ...timer, [field]: value, isCustom: value.trim() !== "" } as ScheduledTimer; // Explicitly cast
          } else if (field === 'type') {
            return { ...timer, [field]: value, customTitle: undefined, isCustom: false } as ScheduledTimer; // Explicitly cast
          }
          return { ...timer, [field]: value } as ScheduledTimer; // Explicitly cast
        }
        return timer;
      })
    );
  };

  const handleRemoveTimer = (id: string) => {
    setSchedule((prev: ScheduledTimer[]) => prev.filter((timer: ScheduledTimer) => timer.id !== id));
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
        description: "Timers must have a duration greater than 0 minutes.",
        variant: "destructive",
      });
      return;
    }

    // Only prompt if the new schedule is 'now' OR if another schedule is already active/prepared
    const shouldPrompt = scheduleStartOption === 'now' && (isRunning || isPaused || isScheduleActive || isSchedulePrepared) ||
                         (scheduleStartOption !== 'now' && (isScheduleActive || isSchedulePrepared));

    if (shouldPrompt) {
      if (!confirm("A timer or schedule is already active. Do you want to override it and commence this new schedule?")) {
        return;
      }
      // If confirmed, reset existing schedule/timer before starting new one
      resetSchedule();
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
      handleEnterKeyNavigation(e); // Call navigation after handling local logic
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

  const handleSaveSchedule = () => {
    saveCurrentScheduleAsTemplate();
    setIsSaveButtonBlue(true);
    setTimeout(() => setIsSaveButtonBlue(false), 1000); // Reset color after 1 second
  };

  const handleColorSelect = (timerId: string, color: string) => {
    setTimerColors(prev => ({ ...prev, [timerId]: color }));
    setEditingColorTimerId(null); // Close picker after selection
  };

  const buttonText =
      (scheduleStartOption === 'now' ? "Begin" : "Prepare");

  return (
    <Card className="px-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 px-4 lg:px-6">
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <CardHeader className="flex flex-row items-center justify-between pt-4 pb-0 px-4 lg:px-6">
          {activeTab === 'plan' ? (
            isEditingScheduleTitle ? (
              <Input
                ref={scheduleTitleInputRef}
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                onKeyDown={handleScheduleTitleInputKeyDown}
                onBlur={handleScheduleTitleInputBlur}
                placeholder="Schedule Title"
                className="text-2xl font-bold h-auto py-2"
                onFocus={(e) => e.target.select()}
                data-input-type="schedule-title" // Added data-input-type
              />
            ) : (
              <CardTitle
                className="text-2xl font-bold h-auto py-2 cursor-pointer select-none"
                onClick={handleScheduleTitleClick}
              >
                {scheduleTitle || "My Schedule"}
              </CardTitle>
            )
          ) : (
            <CardTitle className="text-2xl font-bold h-auto py-2">
              Templates
            </CardTitle>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSchedulingMode(false)} data-ignore-enter-nav>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <TabsContent value="plan" className="pt-0 pb-6 space-y-4 px-4 lg:px-6" id="plan-tab-content">
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {schedule.map((timer, index) => (
              <div 
                key={timer.id} 
                className="relative flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-1 border rounded-md bg-muted/50"
                style={{ backgroundColor: timerColors[timer.id] || '' }} // Apply dynamic background color
              >
                <div className="flex items-center gap-2 flex-grow">
                  <span 
                    className="font-semibold text-sm text-gray-500 flex-shrink-0 self-start cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => setEditingColorTimerId(timer.id)} // Open color picker on click
                  >
                    {index + 1}.
                  </span>
                  {editingColorTimerId === timer.id && (
                    <div className="absolute z-20 top-full left-0 mt-1"> {/* Position picker below the number */}
                      <ColorPicker
                        onSelectColor={(color) => handleColorSelect(timer.id, color)}
                        onClose={() => setEditingColorTimerId(null)}
                        currentColor={timerColors[timer.id]}
                      />
                    </div>
                  )}
                  <Input
                    placeholder="Timer Title"
                    value={timer.title}
                    onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                    className="flex-grow min-w-0"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleEnterKeyNavigation}
                    data-input-type="timer-title" // Added data-input-type
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
                  className="w-16 text-center flex-shrink-0"
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNavigation}
                  data-input-type="timer-duration" // Added data-input-type
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
                    data-input-type="timer-custom-title" // Added data-input-type
                  />
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-20 h-7 text-xs font-medium whitespace-normal text-center flex items-center justify-center", // Updated classes
                      timer.isCustom ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                      timer.type === 'focus' ? "text-public-bg-foreground bg-public-bg hover:bg-public-bg/80" : "text-private-bg-foreground bg-private-bg hover:bg-private-bg/80"
                    )}
                    onMouseDown={() => handleLongPressStart(timer)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(timer)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={() => handleTypeButtonClick(timer)}
                    onKeyDown={handleEnterKeyNavigation} // Add navigation to button
                    data-input-type="timer-type-button" // Added data-input-type for consistency, though it's a button
                  >
                    {timer.customTitle || (timer.type === 'focus' ? 'Focus' : 'Break')}
                  </Button>
                )}
                
                <Trash2 
                  className="h-4 w-4 text-destructive ml-auto flex-shrink-0 cursor-pointer" 
                  onClick={() => handleRemoveTimer(timer.id)} 
                  data-ignore-enter-nav
                />
              </div>
            ))}
          </div>

          <Button onClick={handleAddTimer} variant="outline" className="w-full mt-0" onKeyDown={handleEnterKeyNavigation} data-input-type="add-timer-button">
            <Plus className="mr-2 h-4 w-4" /> Add Timer
          </Button>

          <div className="flex gap-2 mt-4 items-center">
            <Button
              variant={scheduleStartOption === 'now' ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('now')}
              onKeyDown={handleEnterKeyNavigation}
              data-input-type="start-option-button"
            >
              Now
            </Button>
            <Button
              variant={scheduleStartOption === 'manual' ? 'secondary' : 'outline'} // Fixed comparison
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('manual')} // Fixed assignment
              onKeyDown={handleEnterKeyNavigation}
              data-input-type="start-option-button"
            >
              Manual
            </Button>
            <Button
              variant={scheduleStartOption === 'custom_time' ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-auto text-muted-foreground"
              onClick={() => setScheduleStartOption('custom_time')}
              onKeyDown={handleEnterKeyNavigation}
              data-input-type="start-option-button"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveSchedule}
              className={cn("ml-auto", isSaveButtonBlue ? "text-blue-500" : "text-gray-500")}
              onKeyDown={handleEnterKeyNavigation}
              data-input-type="save-schedule-button"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>

          {scheduleStartOption === 'custom_time' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Input
                  id="commence-time"
                  type="time"
                  value={commenceTime}
                  onChange={(e) => {
                    setCommenceTime(e.target.value);
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleEnterKeyNavigation}
                  data-input-type="commence-time" // Added data-input-type
                />
              </div>
              <div className="space-y-2">
                <Select 
                  value={commenceDay === null ? "today-default" : commenceDay.toString()} // Use "today-default" for null
                  onValueChange={(value) => {
                    setCommenceDay(value === "today-default" ? null : parseInt(value)); // Set to null if "today-default" is selected
                  }}
                >
                  <SelectTrigger id="commence-day" onKeyDown={handleEnterKeyNavigation} data-input-type="commence-day">
                    <SelectValue placeholder="Select Day"> {/* Placeholder for blank */}
                      {commenceDay === null ? "Today (default)" : DAYS_OF_WEEK[commenceDay]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today-default">Today (default)</SelectItem> {/* Use non-empty value */}
                    {daysOfWeekDisplayOrder.map((day) => (
                      <SelectItem key={day} value={getDayIndexForDisplayDay(day).toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button onClick={handleCommenceSchedule} className="w-full h-12 text-lg" onKeyDown={handleEnterKeyNavigation} data-input-type="commence-schedule-button">
            <Play className="mr-2 h-5 w-5" />
            {buttonText}
          </Button>
        </TabsContent>
        <TabsContent value="saved" className="pt-0 pb-6 space-y-6 px-4 lg:px-6">
          <ScheduleTemplates setActiveTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ScheduleForm;