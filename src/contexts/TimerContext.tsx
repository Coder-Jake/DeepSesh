import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

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
  hideSessionsDuringTimer: boolean; // New setting
  setHideSessionsDuringTimer: (hide: boolean) => void; // New setter
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
  const [focusMinutes, setFocusMinutes] = useState(55);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(55 * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [hideSessionsDuringTimer, setHideSessionsDuringTimer] = useState(true); // Default to true
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Update timeLeft when focus/break minutes change and timer is not running (but not paused)
  useEffect(() => {
    if (!isRunning && !isFlashing && !isPaused) {
      const newTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
      setTimeLeft(newTime);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isFlashing, isPaused]);

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
    hideSessionsDuringTimer, // New
    setHideSessionsDuringTimer, // New
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};