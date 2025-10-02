import React, { useState, useEffect, useCallback } from 'react';
import { useTimer } from "@/contexts/TimerContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ScheduledTimer } from '@/types/timer'; // Import ScheduledTimer type

const ScheduleForm = () => {
  const {
    schedule: globalSchedule,
    setSchedule,
    startSchedule,
    setIsSchedulingMode,
    scheduleTitle: globalScheduleTitle,
    setScheduleTitle: setGlobalScheduleTitle,
    commenceTime: globalCommenceTime,
    setCommenceTime: setGlobalCommenceTime,
    commenceDay: globalCommenceDay,
    setCommenceDay: setGlobalCommenceDay,
    scheduleStartOption: globalScheduleStartOption,
    setScheduleStartOption: setGlobalScheduleStartOption,
    setIsSchedulePending,
    DAYS_OF_WEEK,
  } = useTimer();

  const [localScheduleTitle, setLocalScheduleTitle] = useState(globalScheduleTitle);
  const [localCommenceDate, setLocalCommenceDate] = useState<Date | undefined>(undefined);
  const [localCommenceTime, setLocalCommenceTime] = useState(globalCommenceTime);
  const [localScheduleItems, setLocalScheduleItems] = useState<ScheduledTimer[]>(
    globalSchedule.length > 0 ? globalSchedule : [{ id: '1', type: 'focus', durationMinutes: 25, title: 'Focus', isCustom: false }]
  );
  const [localScheduleStartOption, setLocalScheduleStartOption] = useState(globalScheduleStartOption);

  // Initialize local state from global context on mount
  useEffect(() => {
    setLocalScheduleTitle(globalScheduleTitle);
    setLocalCommenceTime(globalCommenceTime);
    setLocalScheduleStartOption(globalScheduleStartOption);
    setLocalScheduleItems(globalSchedule.length > 0 ? globalSchedule : [{ id: '1', type: 'focus', durationMinutes: 25, title: 'Focus', isCustom: false }]);
  }, [globalScheduleTitle, globalCommenceTime, globalScheduleStartOption, globalSchedule]);

  // Set localCommenceDate based on globalCommenceDay
  useEffect(() => {
    if (globalCommenceDay !== null) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = (globalCommenceDay - dayOfWeek + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      setLocalCommenceDate(targetDate);
    } else {
      setLocalCommenceDate(undefined);
    }
  }, [globalCommenceDay]);

  const handleAddItem = () => {
    setLocalScheduleItems([...localScheduleItems, { id: String(Date.now()), type: 'focus', durationMinutes: 25, title: 'Focus', isCustom: false }]);
  };

  const handleRemoveItem = (id: string) => {
    setLocalScheduleItems(localScheduleItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setLocalScheduleItems(localScheduleItems.map(item =>
      item.id === id ? { ...item, [field]: value, isCustom: field === 'customTitle' && value !== 'Focus' && value !== 'Break' } : item
    ));
  };

  const handleStartSchedule = () => {
    if (localScheduleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one schedule item.",
        variant: "destructive",
      });
      return;
    }

    // Update global context states with local form values
    setGlobalScheduleTitle(localScheduleTitle);
    setSchedule(localScheduleItems);
    setGlobalCommenceTime(localCommenceTime);
    setGlobalScheduleStartOption(localScheduleStartOption);
    
    if (localScheduleStartOption === 'custom_time' && localCommenceDate) {
      setGlobalCommenceDay(localCommenceDate.getDay());
      setIsSchedulePending(true);
    } else {
      setGlobalCommenceDay(null); // For 'now' option, day is irrelevant
      startSchedule(localScheduleItems);
    }
    
    setIsSchedulingMode(false);
    toast({
      title: "Schedule Set!",
      description: `Your schedule "${localScheduleTitle}" is ready.`,
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setLocalCommenceDate(date);
    if (date) {
      setGlobalCommenceDay(date.getDay()); // Update global day when date is selected
    } else {
      setGlobalCommenceDay(null);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-xl font-semibold text-center">Create Schedule</h3>
      <Input
        placeholder="Schedule Title"
        value={localScheduleTitle}
        onChange={(e) => setLocalScheduleTitle(e.target.value)}
        className="text-lg font-semibold h-auto py-2 px-3"
      />

      <div className="space-y-4">
        {localScheduleItems.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
            <Input
              type="text"
              placeholder="Item Title (e.g., Deep Work, Lunch)"
              value={item.customTitle || item.title}
              onChange={(e) => handleItemChange(item.id, 'customTitle', e.target.value)}
              className="flex-grow"
            />
            <Select
              value={item.type}
              onValueChange={(value: 'focus' | 'break') => handleItemChange(item.id, 'type', value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="break">Break</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={item.durationMinutes}
              onChange={(e) => handleItemChange(item.id, 'durationMinutes', parseInt(e.target.value) || 0)}
              className="w-20 text-center"
              min="1"
            />
            <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(item.id)}>
              -
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={handleAddItem} className="w-full">
          Add Item
        </Button>
      </div>

      <div className="space-y-4">
        <Label htmlFor="start-option">Start Option</Label>
        <Select
          value={localScheduleStartOption}
          onValueChange={(value: 'now' | 'custom_time') => setLocalScheduleStartOption(value)}
        >
          <SelectTrigger id="start-option">
            <SelectValue placeholder="When to start?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="now">Start Now</SelectItem>
            <SelectItem value="custom_time">Custom Time</SelectItem>
          </SelectContent>
        </Select>

        {localScheduleStartOption === 'custom_time' && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !localCommenceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localCommenceDate ? format(localCommenceDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localCommenceDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={localCommenceTime}
              onChange={(e) => setLocalCommenceTime(e.target.value)}
              className="w-[120px]"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setIsSchedulingMode(false)}>
          Cancel
        </Button>
        <Button onClick={handleStartSchedule}>
          {localScheduleStartOption === 'now' ? 'Start Schedule' : 'Schedule'}
        </Button>
      </div>
    </div>
  );
};

export default ScheduleForm;