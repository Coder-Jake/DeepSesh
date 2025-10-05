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
    isSchedulePending, // This is for the *active* schedule, not the prepared ones
    isScheduleActive, // Added for confirmation check
    isRunning, // Added for confirmation check
    isPaused, // Added for confirmation check
    resetSchedule, // Added for confirmation check
    saveCurrentScheduleAsTemplate, // Now exists on TimerContextType
    timerColors, // NEW: Get from context
    setTimerColors, // NEW: Get from context
  } = useTimer();
  const { toast } = useToast();

  // Initialize schedule if it's empty (e.g., first time opening schedule form)
  useEffect(() => {
    if (schedule.length === 0) {
      setSchedule([
        { id: crypto.randomUUID(), title: "Beginning", type: "focus", durationMinutes: 25 },
        { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5 },
        { id: crypto.randomUUID(), title: "Middle", type: "focus", durationMinutes: 60 },
        { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 30 },
        { id: crypto.randomUUID(), title: "End", type: "focus", durationMinutes: 45 },
        { id: crypto.randomUUID(), title: "Networking", type: "break", durationMinutes: 15 },
      ]);
    }
  }, [schedule, setSchedule]);

  // Initialize commenceTime to the nearest following hour if not already set and custom_time is selected
  useEffect(() => {
    if (!commenceTime && scheduleStartOption === 'custom_time') {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();

      // If current minutes are not 0, move to the next hour
      if (minutes > 0) {
        hours = (hours + 1) % 24; // Handle midnight (23 -> 0)
      }

      const nearestHour = String(hours).padStart(2, '0') + ":00";
      setCommenceTime(nearestHour);
    }
  }, [commenceTime, setCommenceTime, scheduleStartOption]);

  const [activeTab, setActiveTab] = useState("plan");

  const [isEditingScheduleTitle, setIsEditingScheduleTitle] = useState(false);
  const scheduleTitleInputRef = useRef<HTMLInputElement>(null);

  // Removed editingCustomTitleId, tempCustomTitle, customTitleInputRef, longPressRef, isLongPress
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

  // Removed useEffect for editingCustomTitleId

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
    setSchedule((prev: ScheduledTimer[]) => {
      const lastTimerType = prev.length > 0 ? prev[prev.length - 1].type : null;
      const newTimerType = lastTimerType === 'focus' ? 'break' : 'focus';
      const newTimerTitle = newTimerType === 'focus' ? "Focus" : "Break"; // Default title based on type
      const newTimerDuration = newTimerType === 'focus' ? 25 : 5; // Default duration based on type

      return [
        ...prev,
        { 
          id: crypto.randomUUID(), 
          title: newTimerTitle, 
          type: newTimerType, 
          durationMinutes: newTimerDuration 
        }
      ];
    });
  };

  const handleUpdateTimer = (id: string, field: keyof ScheduledTimer, value: any) => {
    setSchedule((prev: ScheduledTimer[]) =>
      prev.map(timer => {
        if (timer.id === id) {
          // Simplified logic: 'type' is now directly updated by the Select component
          return { ...timer, [field]: value };
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

    startSchedule(); // Call the context function
  };

  // Removed handleLongPressStart, handleLongPressEnd, handleCustomTitleInputKeyDown, handleCustomTitleInputBlur, handleTypeButtonClick

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
                className="relative flex items-center gap-x-2 px-1 py-1 border rounded-md bg-muted/50" // Changed px-3 to px-2
                style={{ backgroundColor: timerColors[timer.id] || (timer.type === 'focus' ? 'hsl(var(--focus-background))' : '') }} // Apply dynamic background color or default baby blue for focus
              >
                <div className="flex items-center gap-1 flex-grow-0"> {/* Adjusted gap to gap-1 */}
                  <span 
                    className="font-semibold text-sm text-gray-500 flex-shrink-0 cursor-pointer hover:text-foreground transition-colors" // Removed self-start
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
                
                {/* Replaced custom title input/button with Select for timer type */}
                <Select
                  value={timer.type}
                  onValueChange={(value: 'focus' | 'break') => handleUpdateTimer(timer.id, 'type', value)}
                >
                  <SelectTrigger className="w-[90px] h-10 text-sm font-medium flex-shrink-0 text-center hidden" onKeyDown={handleEnterKeyNavigation} data-input-type="timer-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                  </SelectContent>
                </Select>
                
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

          <div className="space-y-0"> {/* New wrapper div with reduced vertical spacing */}
            <div className="flex gap-2 items-center"> {/* Removed mt-4 */}
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
              <div className="grid grid-cols-2 gap-4"> {/* Removed mt-4 */}
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
          </div>

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