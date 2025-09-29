import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { ScheduledTimer } from "@/types/timer"; // Import the new type

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
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
  formatTime: (seconds: number) => string;
  hideSessionsDuringTimer: boolean;
  setHideSessionsDuringTimer: (hide: boolean) => void;

  // New scheduling states and functions
  schedule: ScheduledTimer[];
  setSchedule: (schedule: ScheduledTimer[]) => void;
  currentScheduleIndex: number;
  setCurrentScheduleIndex: (index: number) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (mode: boolean) => void;
  isScheduleActive: boolean;
  setIsScheduleActive: (active: boolean) => void;
  startSchedule: () => void;
  resetSchedule: () => void;
  advanceSchedule: () => void;

  // New states for schedule details
  scheduleTitle: string;
  setScheduleTitle: (title: string) => void;
  commenceTime: string;
  setCommenceTime: (time: string) => void;
  commenceDay: number; // 0 for Sunday, 1 for Monday, etc.
  setCommenceDay: (day: number) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider = ({ children }: TimerProviderProps) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [hideSessionsDuringTimer, setHideSessionsDuringTimer] = useState(true);
  
  // New scheduling states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);

  // New states for schedule details
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [commenceDay, setCommenceDay] = useState(new Date().getDay()); // 0 for Sunday, 1 for Monday, etc.

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playStartSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const advanceSchedule = () => {
    if (currentScheduleIndex < schedule.length - 1) {
      setCurrentScheduleIndex(prev => prev + 1);
    } else {
      // Schedule finished
      setIsScheduleActive(false);
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setCurrentScheduleIndex(0); // Reset index
      // Optionally, reset to default focus/break minutes
      setTimerType('focus');
      setTimeLeft(focusMinutes * 60);
    }
  };

  const startSchedule = () => {
    if (schedule.length > 0) {
      setIsScheduleActive(true);
      setCurrentScheduleIndex(0);
      setIsSchedulingMode(false); // Exit scheduling mode
      setIsRunning(true);
      setIsPaused(false);
      setIsFlashing(false);
      playStartSound();
    }
  };

  const resetSchedule = () => {
    setIsScheduleActive(false);
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setCurrentScheduleIndex(0);
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60); // Reset to default focus time
  };

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFlashing(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Effect to handle timer completion and schedule advancement
  useEffect(() => {
    if (timeLeft === 0 && isFlashing) {
      if (isScheduleActive) {
        // If schedule is active, advance to next item
        advanceSchedule();
      } else {
        // If not part of a schedule, just flash
        // The user will manually switch to break or restart
      }
    }
  }, [timeLeft, isFlashing, isScheduleActive]);


  // Update timeLeft and timerType based on schedule or default settings
  useEffect(() => {
    if (isScheduleActive && schedule.length > 0) {
      const currentItem = schedule[currentScheduleIndex];
      if (currentItem) {
        setTimerType(currentItem.type);
        setTimeLeft(currentItem.durationMinutes * 60);
        // Also update focus/break minutes so the circular progress reflects correctly
        if (currentItem.type === 'focus') {
          setFocusMinutes(currentItem.durationMinutes);
        } else {
          setBreakMinutes(currentItem.durationMinutes);
        }
      }
    } else if (!isRunning && !isFlashing && !isPaused) {
      // Only reset to default if no schedule is active and timer is not running/flashing/paused
      const newTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
      setTimeLeft(newTime);
    }
  }, [currentScheduleIndex, schedule, isScheduleActive, timerType, focusMinutes, breakMinutes, isRunning, isFlashing, isPaused]);


  const value = {
    focusMinutes,
    setFocusMinutes,
    breakMinutes,
    setBreakMinutes,
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
    formatTime,
    hideSessionsDuringTimer,
    setHideSessionsDuringTimer,
    schedule,
    setSchedule,
    currentScheduleIndex,
    setCurrentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    startSchedule,
    resetSchedule,
    advanceSchedule,
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};