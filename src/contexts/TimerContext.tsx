import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer } from '@/types/timer';
import { toast } from '@/hooks/use-toast';

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  hideSessionsDuringTimer: boolean;
  setHideSessionsDuringTimer: (hide: boolean) => void;
  timerIncrement: number;
  setTimerIncrement: (increment: number) => void;
  formatTime: (seconds: number) => string;

  // Timer control states
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  timerType: 'focus' | 'break';
  setTimerType: (type: 'focus' | 'break') => void;
  isFlashing: boolean;
  setIsFlashing: (flashing: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;

  // Scheduling states and functions
  schedule: ScheduledTimer[];
  setSchedule: (schedule: ScheduledTimer[]) => void;
  currentScheduleIndex: number;
  setCurrentScheduleIndex: (index: number) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (mode: boolean) => void;
  isScheduleActive: boolean;
  setIsScheduleActive: (active: boolean) => void;
  scheduleTitle: string;
  setScheduleTitle: (title: string) => void;
  commenceTime: string;
  setCommenceTime: (time: string) => void;
  commenceDay: number;
  setCommenceDay: (day: number) => void;
  startSchedule: () => void;
  resetSchedule: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [hideSessionsDuringTimer, setHideSessionsDuringTimer] = useState(false);
  const [timerIncrement, setTimerIncrement] = useState(5);

  // Timer control states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");

  // Scheduling states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My DeepSesh Schedule");
  const [commenceTime, setCommenceTime] = useState(new Date().toTimeString().slice(0, 5)); // HH:MM format
  const [commenceDay, setCommenceDay] = useState(new Date().getDay()); // 0 for Sunday, 1 for Monday, etc.

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const flashingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Utility function to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const playEndSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const startSchedule = useCallback(() => {
    if (schedule.length > 0) {
      setIsScheduleActive(true);
      setCurrentScheduleIndex(0);
      setTimerType(schedule[0].type);
      setTimeLeft(schedule[0].durationMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setIsFlashing(false);
      setIsSchedulingMode(false);
      toast({
        title: "Schedule Commenced!",
        description: `Starting "${schedule[0].title}" for ${schedule[0].durationMinutes} minutes.`,
      });
    }
  }, [schedule]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
    setScheduleTitle("My DeepSesh Schedule");
    setCommenceTime(new Date().toTimeString().slice(0, 5));
    setCommenceDay(new Date().getDay());
    toast({
      title: "Schedule Reset",
      description: "Your current schedule has been cleared.",
    });
  }, [focusMinutes]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current!);
            playEndSound();
            setIsRunning(false);
            setIsFlashing(true); // Start flashing when timer hits 0

            if (isScheduleActive) {
              const nextIndex = currentScheduleIndex + 1;
              if (nextIndex < schedule.length) {
                // Automatically transition to the next item in the schedule
                setCurrentScheduleIndex(nextIndex);
                setTimerType(schedule[nextIndex].type);
                setTimeLeft(schedule[nextIndex].durationMinutes * 60);
                setIsRunning(true);
                setIsFlashing(false);
                toast({
                  title: "Next in Schedule!",
                  description: `Starting "${schedule[nextIndex].title}" for ${schedule[nextIndex].durationMinutes} minutes.`,
                });
              } else {
                // Schedule completed
                setIsScheduleActive(false);
                setCurrentScheduleIndex(0);
                toast({
                  title: "Schedule Completed!",
                  description: "All timers in your schedule have finished.",
                });
              }
            } else {
              // Regular timer finished, prompt user to switch or stop
              toast({
                title: "Time's Up!",
                description: `Your ${timerType} session has ended.`,
                variant: "default",
              });
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isRunning, isPaused, isScheduleActive, currentScheduleIndex, schedule, timerType, playEndSound]);

  useEffect(() => {
    if (isFlashing) {
      flashingIntervalRef.current = setInterval(() => {
        // Toggle a class or state for visual flashing effect
      }, 500); // Flash every 500ms
    } else {
      clearInterval(flashingIntervalRef.current!);
    }
    return () => clearInterval(flashingIntervalRef.current!);
  }, [isFlashing]);

  // Update timeLeft when focusMinutes or breakMinutes change, but only if timer is not running/paused
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive]);


  const value = {
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    setBreakMinutes,
    hideSessionsDuringTimer,
    setHideSessionsDuringTimer,
    timerIncrement,
    setTimerIncrement,
    formatTime,

    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    timeLeft,
    setTimeLeft,
    timerType,
    setTimerType,
    isFlashing,
    setIsFlashing,
    notes,
    setNotes,

    schedule,
    setSchedule,
    currentScheduleIndex,
    setCurrentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
    startSchedule,
    resetSchedule,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};