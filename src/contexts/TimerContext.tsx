"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer, TimerContextType } from '@/types/timer';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState("");
  const [commenceDay, setCommenceDay] = useState(new Date().getDay());
  const timerIncrement = 5; // Default increment

  // New states for recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Placeholder for actual timer logic
  const startSchedule = useCallback(() => {
    console.log("Starting schedule:", {
      schedule,
      scheduleTitle,
      commenceTime,
      commenceDay,
      isRecurring,
      recurrenceFrequency,
    });
    setIsSchedulingMode(false); // Exit scheduling mode after starting
    // In a real application, this would trigger the actual timer or scheduling logic
  }, [schedule, scheduleTitle, commenceTime, commenceDay, isRecurring, recurrenceFrequency]);

  const value = {
    schedule,
    setSchedule,
    isSchedulingMode,
    setIsSchedulingMode,
    startSchedule,
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
    timerIncrement,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
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