import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { ScheduledTimer } from "@/types/timer"; // Assuming this type is defined in types/timer.ts

// Define DAYS_OF_WEEK here as it's imported from this context
export const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface TimerContextType {
  schedule: ScheduledTimer[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  setIsSchedulingMode: React.Dispatch<React.SetStateAction<boolean>>;
  startSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null;
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'manual' | 'custom_time'>>;
  timerIncrement: number;
  isRecurring: boolean;
  setIsRecurring: React.Dispatch<React.SetStateAction<boolean>>;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  setRecurrenceFrequency: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly'>>;
  isSchedulePending: boolean;
  isSchedulePrepared: boolean;
  saveCurrentScheduleAsTemplate: () => void;
  isRunning: boolean;
  isPaused: boolean;
  isScheduleActive: boolean;
  resetSchedule: () => void;
  timerColors: Record<string, string>;
  setTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  formatTime: (seconds: number) => string;
  currentScheduleIndex: number;
  timeLeft: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const getDefaultCommenceTime = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();

  // If current minutes are not 0, we need to go to the next hour
  if (minutes > 0) {
    hours = (hours + 1) % 24; // Increment hour, wrap around at 24
  }
  // If minutes are 0, we use the current hour.

  // Format to HH:00
  const formattedHours = hours.toString().padStart(2, '0');
  return `${formattedHours}:00`;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState<string>(getDefaultCommenceTime());
  const [commenceDay, setCommenceDay] = useState<number | null>(null); // null means "today"
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now');
  const [timerIncrement] = useState(5); // Default increment for timer durations
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isSchedulePending, setIsSchedulePending] = useState(false);
  const [isSchedulePrepared, setIsSchedulePrepared] = useState(false); // New state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [timerColors, setTimerColors] = useState<Record<string, string>>({});
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
      .map(v => v.toString().padStart(2, '0'))
      .filter((v, i) => v !== '00' || i > 0 || h > 0) // Hide hours if 0, unless it's the only part
      .join(':');
  };

  const startSchedule = useCallback(() => {
    if (scheduleStartOption === 'custom_time') {
      setIsSchedulePending(true);
      setIsSchedulePrepared(true); // Mark as prepared when pending
      setIsSchedulingMode(false); // Close the form
    } else {
      // For 'now' or 'manual' start
      if (schedule.length > 0) {
        setCurrentScheduleIndex(0);
        setTimeLeft(schedule[0].durationMinutes * 60);
        setIsRunning(true);
        setIsPaused(false);
        setIsScheduleActive(true);
        setIsSchedulePending(false);
        setIsSchedulePrepared(false);
        setIsSchedulingMode(false); // Close the form
      }
    }
  }, [schedule, scheduleStartOption, setIsSchedulingMode]);

  const resetSchedule = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setIsScheduleActive(false);
    setIsSchedulePending(false);
    setIsSchedulePrepared(false);
    setCurrentScheduleIndex(-1);
    setTimeLeft(0);
    // Optionally reset schedule content or title if desired
    // setSchedule([]);
    // setScheduleTitle("My Schedule");
    // setTimerColors({});
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer for current item ended
      if (currentScheduleIndex < schedule.length - 1) {
        // Move to next item
        setCurrentScheduleIndex(prev => prev + 1);
        setTimeLeft(schedule[currentScheduleIndex + 1].durationMinutes * 60);
      } else {
        // Schedule completed
        resetSchedule();
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, currentScheduleIndex, schedule, resetSchedule]);

  const saveCurrentScheduleAsTemplate = () => {
    // This function would typically save the current 'schedule' and 'scheduleTitle'
    // to a persistent storage (e.g., local storage, database).
    // For now, it's a placeholder.
    console.log("Saving current schedule as template:", { scheduleTitle, schedule, timerColors });
    // In a real app, you'd store this data.
  };

  const value = {
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
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    isSchedulePending,
    isSchedulePrepared,
    saveCurrentScheduleAsTemplate,
    isRunning,
    isPaused,
    isScheduleActive,
    resetSchedule,
    timerColors,
    setTimerColors,
    formatTime,
    currentScheduleIndex,
    timeLeft,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};