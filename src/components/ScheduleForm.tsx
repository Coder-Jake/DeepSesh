import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, X, Clock, Save, Repeat, Building2 } from "lucide-react"; // Added Building2 icon
import { useTimer } from "@/contexts/TimerContext";
import { ScheduledTimer } from "@/types/timer";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleTemplates from './ScheduleTemplates';
import ColorPicker from './ColorPicker';
import { DAYS_OF_WEEK } from "@/lib/constants";
import { useTheme } from '@/contexts/ThemeContext';
import { useProfile } from '@/contexts/ProfileContext'; // NEW: Import useProfile

const ScheduleForm: React.FC = () => {
  const { 
    schedule,
    setSchedule, 
    setIsSchedulingMode, 
    startSchedule, 
    scheduleTitle: contextScheduleTitle,
    setScheduleTitle: setContextScheduleTitle,
    commenceTime, 
    setCommenceTime, 
    commenceDay, 
    setCommenceDay,
    scheduleStartOption, 
    setScheduleStartOption, 
    timerIncrement,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    isSchedulePending,
    isScheduleActive,
    isRunning,
    isPaused,
    resetSchedule,
    saveCurrentScheduleAsTemplate,
    timerColors,
    setTimerColors,
    areToastsEnabled,
    formatTime, 
    is24HourFormat, 
    getDefaultSeshTitle,
    sessionVisibility, // ADDED: sessionVisibility
    selectedHostingOrganisation, // NEW: Get selectedHostingOrganisation
    setSelectedHostingOrganisation, // NEW: Get setSelectedHostingOrganisation
  } = useTimer();

  const { isDarkMode } = useTheme();
  const { profile } = useProfile(); // NEW: Get profile from useProfile

  // Local state for scheduleTitle, initialized from context or default
  const [scheduleTitle, setScheduleTitle] = useState(contextScheduleTitle || getDefaultSeshTitle());

  // Sync local scheduleTitle with contextScheduleTitle when context changes
  useEffect(() => {
    setScheduleTitle(contextScheduleTitle || getDefaultSeshTitle());
  }, [contextScheduleTitle, getDefaultSeshTitle]);

  // NEW: Sync selectedHostingOrganisation with the first organisation from profile if available
  useEffect(() => {
    if (profile?.organisation && profile.organisation.length > 0 && !selectedHostingOrganisation) {
      setSelectedHostingOrganisation(profile.organisation[0]);
    } else if (!profile?.organisation || profile.organisation.length === 0) {
      setSelectedHostingOrganisation(null);
    }
  }, [profile?.organisation, selectedHostingOrganisation, setSelectedHostingOrganisation]);

  useEffect(() => {
    if (!commenceTime && scheduleStartOption === 'custom_time') {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();

      if (minutes > 0) {
        hours = (hours + 1) % 24;
      }

      const nearestHour = String(hours).padStart(2, '0') + ":00";
      setCommenceTime(nearestHour);
    }
  }, [commenceTime, setCommenceTime, scheduleStartOption]);

  const [activeTab, setActiveTab] = useState("plan");

  const [isEditingScheduleTitle, setIsEditingScheduleTitle] = useState(false);
  const scheduleTitleInputRef = useRef<HTMLInputElement>(null);

  const [isSaveButtonBlue, setIsSaveButtonBlue] = useState(false);

  const [editingColorTimerId, setEditingColorTimerId] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);

  const [visibleTrashId, setVisibleTrashId] = useState<string | null>(null);
  const trashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showTrashAllButton, setShowTrashAllButton] = useState(false);
  const trashAllTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showTotalDuration, setShowTotalDuration] = useState(false);

  const daysOfWeekDisplayOrder = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  const getDayIndexForDisplayDay = (displayDay: string): number => {
    switch (displayDay) {
      case "Monday": return 1;
      case "Tuesday": return 2;
      case "Thursday": return 3;
      case "Wednesday": return 4;
      case "Friday": return 5;
      case "Saturday": return 6;
      case "Sunday": return 0;
      default: return -1;
    }
  };

  useEffect(() => {
    if (isEditingScheduleTitle && scheduleTitleInputRef.current) {
      scheduleTitleInputRef.current.focus();
      scheduleTitleInputRef.current.select();
    }
  }, [isEditingScheduleTitle]);

  const handleEnterKeyNavigation = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const activeElement = document.activeElement as HTMLElement;
      const inputType = activeElement.dataset.inputType;

      if (inputType) {
        const formElement = document.getElementById('plan-tab-content');
        if (!formElement) return;

        const sameTypeElements = Array.from(
          formElement.querySelectorAll<HTMLElement>(`[data-input-type="${inputType}"]`)
        ).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);

        const currentIndex = sameTypeElements.indexOf(activeElement);
        if (currentIndex > -1 && currentIndex < sameTypeElements.length - 1) {
          sameTypeElements[currentIndex + 1].focus();
        } else if (currentIndex === sameTypeElements.length - 1) {
          activeElement.blur();
        }
      } else {
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
        setScheduleTitle(getDefaultSeshTitle());
      }
      setContextScheduleTitle(scheduleTitle.trim() === "" ? getDefaultSeshTitle() : scheduleTitle);
      handleEnterKeyNavigation(e);
    }
  };

  const handleScheduleTitleInputBlur = () => {
    setIsEditingScheduleTitle(false);
    if (scheduleTitle.trim() === "") {
      setScheduleTitle(getDefaultSeshTitle());
    }
    setContextScheduleTitle(scheduleTitle.trim() === "" ? getDefaultSeshTitle() : scheduleTitle);
  };

  const handleAddTimer = () => {
    setSchedule((prev: ScheduledTimer[]) => {
      const lastTimerType = prev.length > 0 ? prev[prev.length - 1].type : null;
      const newTimerType = lastTimerType === 'focus' ? 'break' : 'focus';
      const newTimerTitle = newTimerType === 'focus' ? "Focus" : "Break";
      const newTimerDuration = newTimerType === 'focus' ? 25 : 5;

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
          return { ...timer, [field]: value };
        }
        return timer;
      })
    );
  };

  const handleRemoveTimer = (id: string) => {
    setSchedule((prev: ScheduledTimer[]) => prev.filter((timer: ScheduledTimer) => timer.id !== id));
    setVisibleTrashId(null);
    if (trashTimeoutRef.current) {
      clearTimeout(trashTimeoutRef.current);
    }
    
    if (trashAllTimeoutRef.current) {
      clearTimeout(trashAllTimeoutRef.current);
    }
    setShowTrashAllButton(true);
    trashAllTimeoutRef.current = setTimeout(() => {
      setShowTrashAllButton(false);
    }, 3000);
  };

  const handleTrashAllTimers = () => {
    setSchedule([]);
    setVisibleTrashId(null);
    if (trashTimeoutRef.current) {
      clearTimeout(trashTimeoutRef.current);
    }
    if (areToastsEnabled) {
      toast.info("Schedule Cleared", {
        description: "All timers have been removed from the schedule.",
      });
    }
    if (trashAllTimeoutRef.current) {
      clearTimeout(trashAllTimeoutRef.current);
    }
    setShowTrashAllButton(false);
  };

  const handleCommenceSchedule = () => {
    if (!scheduleTitle.trim()) {
      if (areToastsEnabled) {
        toast.error("Schedule Title Missing", {
          description: "Please enter a title for your schedule.",
        });
      }
      return;
    }
    if (schedule.length === 0) {
      if (areToastsEnabled) {
        toast.error("No Timers in Schedule", {
          description: "Please add at least one timer to your schedule.",
        });
      }
      return;
    }
    if (schedule.some(timer => timer.durationMinutes <= 0)) {
      if (areToastsEnabled) {
        toast.error("Invalid Duration", {
          description: "Timers must have a duration greater than 0 minutes.",
        });
      }
      return;
    }
    if (sessionVisibility === 'organisation' && !selectedHostingOrganisation) { // NEW: Check if organisation is selected
      if (areToastsEnabled) {
        toast.error("Organisation Not Selected", {
          description: "Please select an organisation to host this session.",
        });
      }
      return;
    }

    setContextScheduleTitle(scheduleTitle);
    startSchedule();
  };

  const handleSaveSchedule = () => {
    setContextScheduleTitle(scheduleTitle);
    saveCurrentScheduleAsTemplate();
    setIsSaveButtonBlue(true);
    setTimeout(() => setIsSaveButtonBlue(false), 1000);
  };

  const handleColorSelect = (timerId: string, color: string) => {
    setTimerColors(prev => ({ ...prev, [timerId]: color }));
    setEditingColorTimerId(null);
    setPickerPosition(null);
  };

  const handleOpenColorPicker = (e: React.MouseEvent, timerId: string) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setEditingColorTimerId(timerId);
    setPickerPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
  };

  const handleCloseColorPicker = () => {
    setEditingColorTimerId(null);
    setPickerPosition(null);
  };

  const handleTimerDivClick = (timerId: string) => {
    if (trashTimeoutRef.current) {
      clearTimeout(trashTimeoutRef.current);
    }
    setVisibleTrashId(timerId);
    trashTimeoutRef.current = setTimeout(() => {
      setVisibleTrashId(null);
    }, 2000);
  };

  const buttonText =
      (scheduleStartOption === 'now' ? "Begin" : "Prepare");

  const getScheduleBaseStartTime = useCallback(() => {
    if (scheduleStartOption !== 'custom_time' || !commenceTime) {
      return null;
    }

    const now = new Date();
    const [hours, minutes] = commenceTime.split(':').map(Number);
    let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

    const currentDay = now.getDay();
    const templateDay = commenceDay === null ? currentDay : commenceDay;
    
    let daysToAdd = (templateDay - currentDay + 7) % 7;
    targetDate.setDate(now.getDate() + daysToAdd);

    if (targetDate.getTime() < now.getTime() && daysToAdd === 0) {
      targetDate.setDate(targetDate.getDate() + 7);
    }
    return targetDate;
  }, [scheduleStartOption, commenceTime, commenceDay]);

  const itemStartTimes = useMemo(() => {
    const startTimes: Record<string, string> = {};
    if (scheduleStartOption !== 'custom_time' || !commenceTime) {
      return startTimes;
    }

    const baseDate = getScheduleBaseStartTime();
    if (!baseDate) return startTimes;

    let accumulatedMinutes = 0;
    schedule.forEach((item) => {
      const itemStartDate = new Date(baseDate.getTime() + accumulatedMinutes * 60 * 1000);
      startTimes[item.id] = itemStartDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: is24HourFormat ? 'h23' : 'h12'
      });
      accumulatedMinutes += item.durationMinutes;
    });
    return startTimes;
  }, [schedule, scheduleStartOption, commenceTime, commenceDay, getScheduleBaseStartTime, is24HourFormat]);

  const totalDurationMinutes = useMemo(() => {
    return schedule.reduce((sum, timer) => sum + timer.durationMinutes, 0);
  }, [schedule]);

  const scheduleEndTime = useMemo(() => {
    if (totalDurationMinutes === 0) return null;

    let baseDate: Date | null = null;

    if (scheduleStartOption === 'custom_time') {
      baseDate = getScheduleBaseStartTime();
    } else if (scheduleStartOption === 'now') {
      baseDate = new Date();
    }

    if (!baseDate) return null;

    const endDate = new Date(baseDate.getTime() + totalDurationMinutes * 60 * 1000);
    return endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: is24HourFormat ? 'h23' : 'h12'
    });
  }, [scheduleStartOption, totalDurationMinutes, getScheduleBaseStartTime, is24HourFormat]);

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return "";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (remainingMinutes > 0) {
      parts.push(`${remainingMinutes}m`);
    }
    
    return parts.join(' ');
  };

  // NEW: Logic for Host as selector
  const userOrganisations = useMemo(() => profile?.organisation || [], [profile?.organisation]);
  const shouldShowOrgSelector = sessionVisibility === 'organisation' && userOrganisations.length > 0;
  const useToggleButton = userOrganisations.length <= 4;

  const handleCycleOrganisation = useCallback(() => {
    if (!userOrganisations || userOrganisations.length === 0) return;

    const currentIndex = selectedHostingOrganisation
      ? userOrganisations.indexOf(selectedHostingOrganisation)
      : -1;

    const nextIndex = (currentIndex + 1) % userOrganisations.length;
    setSelectedHostingOrganisation(userOrganisations[nextIndex]);

    if (areToastsEnabled) {
      toast.info("Hosting Organisation", {
        description: `Now hosting as '${userOrganisations[nextIndex]}'.`,
      });
    }
  }, [userOrganisations, selectedHostingOrganisation, setSelectedHostingOrganisation, areToastsEnabled]);

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
                id="schedule-title-input"
                name="scheduleTitle"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                onKeyDown={handleScheduleTitleInputKeyDown}
                onBlur={handleScheduleTitleInputBlur}
                placeholder={getDefaultSeshTitle()}
                className="text-2xl font-bold h-auto py-2"
                onFocus={(e) => e.target.select()}
                data-input-type="schedule-title"
              />
            ) : (
              <CardTitle
                className="text-2xl font-bold h-auto py-2 cursor-pointer select-none"
                onClick={handleScheduleTitleClick}
              >
                {scheduleTitle || getDefaultSeshTitle()}
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
          {shouldShowOrgSelector && ( // NEW: Organisation selection
            <div className="flex items-center gap-2">
              {useToggleButton ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCycleOrganisation}
                  className="h-8 px-3 text-sm ml-auto"
                >
                  {selectedHostingOrganisation || (userOrganisations.length > 0 ? userOrganisations[0] : "None")}
                </Button>
              ) : (
                <Select
                  value={selectedHostingOrganisation || ""}
                  onValueChange={setSelectedHostingOrganisation}
                  name="selectedHostingOrganisation"
                  id="select-hosting-org"
                >
                  <SelectTrigger className="w-[180px] h-8 text-sm ml-auto">
                    <SelectValue placeholder="Select Organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOrganisations.map(org => (
                      <SelectItem key={org} value={org}>{org}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-1 pr-2">
            {schedule.map((timer, index) => {
              const defaultFocusBg = isDarkMode ? 'hsl(var(--focus-background-solid-dark))' : 'hsl(var(--focus-background-solid-light))';
              const defaultBreakBg = isDarkMode ? 'hsl(var(--break-background-solid-dark))' : 'hsl(var(--break-background-solid-light))';
              const itemBackgroundColor = timerColors[timer.id] || (timer.type === 'focus' ? defaultFocusBg : defaultBreakBg);

              return (
                <div 
                  key={timer.id} 
                  className="relative flex items-center gap-x-2 px-1 py-1 border rounded-md bg-muted/50"
                  style={{ backgroundColor: itemBackgroundColor }}
                  onClick={() => handleTimerDivClick(timer.id)}
                >
                  <div className="flex items-center gap-1 flex-grow-0">
                    <span 
                      className="font-semibold text-sm text-gray-500 flex-shrink-0 cursor-pointer transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleOpenColorPicker(e, timer.id); }}
                    >
                      {index + 1}.
                    </span>
                    <Input
                      id={`timer-title-${timer.id}`}
                      name={`timerTitle-${timer.id}`}
                      placeholder="Timer Title"
                      value={timer.title}
                      onChange={(e) => handleUpdateTimer(timer.id, 'title', e.target.value)}
                      className="flex-grow min-w-0"
                      onFocus={(e) => e.target.select()}
                      onKeyDown={handleEnterKeyNavigation}
                      data-input-type="timer-title"
                    />
                  </div>
                  
                  <Input
                    id={`timer-duration-${timer.id}`}
                    name={`timerDuration-${timer.id}`}
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
                    className="w-16 text-center flex-shrink-0 pr-0"
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleEnterKeyNavigation}
                    data-input-type="timer-duration"
                  />
                  
                  {scheduleStartOption === 'custom_time' && itemStartTimes[timer.id] && (
                    <span className="text-sm text-muted-foreground flex-shrink-0 text-right">
                      {itemStartTimes[timer.id]}
                    </span>
                  )}

                  <Select
                    value={timer.type}
                    onValueChange={(value: 'focus' | 'break') => handleUpdateTimer(timer.id, 'type', value)}
                    name={`timerType-${timer.id}`}
                    id={`timer-type-${timer.id}`}
                  >
                    <SelectTrigger className="w-[90px] h-10 text-sm font-medium flex-shrink-0 text-center hidden" onKeyDown={handleEnterKeyNavigation} data-input-type="timer-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="focus">Focus</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {visibleTrashId === timer.id && (
                    <Trash2 
                      className="h-4 w-4 text-destructive ml-auto flex-shrink-0 cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); handleRemoveTimer(timer.id); }}
                      data-ignore-enter-nav
                    />
                  )}
                </div>
              );
            })}
          </div>

          {totalDurationMinutes > 0 && (scheduleStartOption === 'now' || scheduleStartOption === 'custom_time') && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRecurring(prev => !prev)} 
                className={cn(
                  "h-8 w-8 rounded-full focus:bg-transparent active:bg-transparent", 
                  isRecurring ? "text-[hsl(120_30%_45%)]" : "text-muted-foreground",
                  "hover:bg-accent-hover"
                )}
                aria-label="Toggle schedule loop"
              >
                <Repeat className="h-4 w-4" strokeWidth={isRecurring ? 3 : 2} /> 
              </Button>
              <span className="flex-grow text-center">
                {showTotalDuration && totalDurationMinutes > 0 && (
                  <span className="mr-1">{formatDuration(totalDurationMinutes)} - </span>
                )}
                {scheduleEndTime && (
                  <span
                    className="cursor-pointer transition-colors"
                    onClick={() => setShowTotalDuration(prev => !prev)}
                  >
                    {isRecurring ? "Loops: " : "End: "} {scheduleEndTime}
                  </span>
                )}
              </span>
              {showTrashAllButton && schedule.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTrashAllTimers}
                  className="h-8 w-8 text-destructive hover:bg-destructive-hover"
                  aria-label="Trash all schedule lines"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {(!showTrashAllButton || schedule.length === 0) && (
                <div className="w-8 h-8"></div>
              )}
            </div>
          )}

          <Button onClick={handleAddTimer} variant="outline" className="w-full mt-0" onKeyDown={handleEnterKeyNavigation} data-input-type="add-timer-button">
            <Plus className="mr-2 h-4 w-4" /> Add Timer
          </Button>

          <div className="space-y-0">
            <div className="flex gap-2 items-center">
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
                variant={scheduleStartOption === 'manual' ? 'secondary' : 'outline'}
                size="sm"
                className="text-xs px-3 py-1 h-auto text-muted-foreground"
                onClick={() => setScheduleStartOption('manual')}
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
                className={cn("ml-auto", isSaveButtonBlue ? "text-blue-500" : "text-gray-500", "hover:bg-accent-hover")}
                onKeyDown={handleEnterKeyNavigation}
                data-input-type="save-schedule-button"
              >
                <Save className="h-5 w-5" />
              </Button>
            </div>

            {scheduleStartOption === 'custom_time' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="commence-time"
                    name="commenceTime"
                    type="time"
                    value={commenceTime}
                    onChange={(e) => {
                      setCommenceTime(e.target.value);
                    }}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={handleEnterKeyNavigation}
                    data-input-type="commence-time"
                    className="pr-0"
                  />
                </div>
                <div className="space-y-2">
                  <Select 
                    value={commenceDay === null ? "today-default" : commenceDay.toString()}
                    onValueChange={(value) => {
                      setCommenceDay(value === "today-default" ? null : parseInt(value));
                    }}
                    name="commenceDay"
                    id="commence-day"
                  >
                    <SelectTrigger onKeyDown={handleEnterKeyNavigation} data-input-type="commence-day">
                      <SelectValue placeholder="Select Day">
                        {commenceDay === null ? "Today (default)" : DAYS_OF_WEEK[commenceDay]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today-default">Today (default)</SelectItem>
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

      {editingColorTimerId && pickerPosition && (
        <div
          className="absolute z-50"
          style={{ top: pickerPosition.top, left: pickerPosition.left }}
        >
          <ColorPicker
            onSelectColor={(color) => handleColorSelect(editingColorTimerId, color)}
            onClose={handleCloseColorPicker}
            currentColor={timerColors[editingColorTimerId]}
          />
        </div>
      )}
    </Card>
  );
};

export default ScheduleForm;