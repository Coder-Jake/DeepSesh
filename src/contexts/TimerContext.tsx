import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer } from '@/types/timer';
import { toast } from '@/hooks/use-toast'; // Using shadcn toast for UI feedback
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

// Define types for Ask items
interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface PollOption {
  id: string;
  text: string;
  votes: { userId: string }[];
}

interface Poll {
  id: string;
  question: string;
  type: 'closed' | 'choice' | 'selection';
  creator: string;
  options: PollOption[];
  status: 'active' | 'closed';
  allowCustomResponses: boolean;
}

type ActiveAskItem = ExtendSuggestion | Poll;

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: React.Dispatch<React.SetStateAction<number>>;
  breakMinutes: number;
  setBreakMinutes: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  timerType: 'focus' | 'break';
  setTimerType: React.Dispatch<React.SetStateAction<'focus' | 'break'>>;
  isFlashing: boolean;
  setIsFlashing: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  seshTitle: string;
  setSeshTitle: React.Dispatch<React.SetStateAction<string>>;
  formatTime: (seconds: number) => string;
  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: React.Dispatch<React.SetStateAction<boolean>>;
  timerIncrement: number;

  // Schedule related states and functions
  schedule: ScheduledTimer[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  currentScheduleIndex: number;
  setCurrentScheduleIndex: React.Dispatch<React.SetStateAction<number>>;
  isSchedulingMode: boolean;
  setIsSchedulingMode: React.Dispatch<React.SetStateAction<boolean>>;
  isScheduleActive: boolean;
  setIsScheduleActive: React.Dispatch<React.SetStateAction<boolean>>;
  startSchedule: () => void;
  resetSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null;
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;

  // New session tracking states and functions
  sessionStartTime: number | null;
  setSessionStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  currentPhaseStartTime: number | null;
  setCurrentPhaseStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  accumulatedFocusSeconds: number;
  setAccumulatedFocusSeconds: React.Dispatch<React.SetStateAction<number>>;
  accumulatedBreakSeconds: number;
  setAccumulatedBreakSeconds: React.Dispatch<React.SetStateAction<number>>;
  activeJoinedSessionCoworkerCount: number;
  setActiveJoinedSessionCoworkerCount: React.Dispatch<React.SetStateAction<number>>;
  saveSessionToHistory: () => Promise<void>;

  // Active Asks
  activeAsks: ActiveAskItem[];
  addAsk: (ask: ActiveAskItem) => void;
  updateAsk: (ask: ActiveAskItem) => void;

  // Schedule pending state
  isSchedulePending: boolean;
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleStartOption: 'now' | 'custom_time';
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'custom_time'>>;
}

export const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext

  const timerIncrement = 5; // Default increment for focus/break minutes

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes");
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule related states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Focus Sesh");
  const [commenceTime, setCommenceTime] = useState("09:00");
  const [commenceDay, setCommenceDay] = useState<number | null>(null); // 0 for Sunday, 1 for Monday, etc.
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);

  // New session tracking states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Active Asks state
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]);

  // Schedule pending state
  const [isSchedulePending, setIsSchedulePending] = useState(false);
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'custom_time'>('now');

  const playSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const formatTime = useCallback((totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
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
      setSessionStartTime(Date.now());
      setCurrentPhaseStartTime(Date.now());
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      toast({
        title: "Schedule Started!",
        description: `"${scheduleTitle}" has begun.`,
      });
    }
  }, [schedule, scheduleTitle]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setScheduleTitle("My Focus Sesh");
    setCommenceTime("09:00");
    setCommenceDay(null);
    setIsSchedulePending(false);
    setScheduleStartOption('now');
    // Reset main timer to default focus
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setNotes("");
    setSeshTitle("Notes");
  }, [focusMinutes]);

  const saveSessionToHistory = useCallback(async () => {
    if (!user || !sessionStartTime) {
      console.warn("Cannot save session: User not logged in or session not started.");
      return;
    }

    // Ensure current phase time is accumulated before saving
    let finalAccumulatedFocus = accumulatedFocusSeconds;
    let finalAccumulatedBreak = accumulatedBreakSeconds;

    if (isRunning && currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        finalAccumulatedFocus += elapsed;
      } else {
        finalAccumulatedBreak += elapsed;
      }
    }

    const totalSessionSeconds = finalAccumulatedFocus + finalAccumulatedBreak;

    if (totalSessionSeconds === 0) {
      toast({
        title: "Session not saved",
        description: "Session was too short to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: user.id,
            title: seshTitle,
            notes: notes,
            focus_duration_seconds: Math.round(finalAccumulatedFocus),
            break_duration_seconds: Math.round(finalAccumulatedBreak),
            total_session_seconds: Math.round(totalSessionSeconds),
            coworker_count: activeJoinedSessionCoworkerCount,
            session_start_time: new Date(sessionStartTime).toISOString(),
            session_end_time: new Date().toISOString(),
          },
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Session Saved!",
        description: "Your session has been added to your history.",
      });

      // Reset all timer states after saving
      setIsRunning(false);
      setIsPaused(false);
      setIsFlashing(false);
      setTimerType('focus');
      setTimeLeft(focusMinutes * 60);
      setSessionStartTime(null);
      setCurrentPhaseStartTime(null);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setActiveJoinedSessionCoworkerCount(0);
      setNotes("");
      setSeshTitle("Notes");
      if (isScheduleActive) resetSchedule();

    } catch (error: any) {
      console.error("Error saving session:", error.message);
      toast({
        title: "Error saving session",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, sessionStartTime, seshTitle, notes, accumulatedFocusSeconds, accumulatedBreakSeconds, isRunning, currentPhaseStartTime, timerType, activeJoinedSessionCoworkerCount, focusMinutes, isScheduleActive, resetSchedule]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(timerRef.current!);
      setIsRunning(false);
      setIsFlashing(true);
      playSound();

      if (isScheduleActive) {
        // Accumulate time for the phase just ended
        if (currentPhaseStartTime !== null) {
          const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
          if (timerType === 'focus') {
            setAccumulatedFocusSeconds((prev: number) => prev + elapsed);
          } else {
            setAccumulatedBreakSeconds((prev: number) => prev + elapsed);
          }
        }

        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < schedule.length) {
          setCurrentScheduleIndex(nextIndex);
          setTimerType(schedule[nextIndex].type);
          setTimeLeft(schedule[nextIndex].durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          // Schedule completed
          toast({
            title: "Schedule Completed!",
            description: `"${scheduleTitle}" has finished.`,
          });
          saveSessionToHistory(); // Save the completed schedule as a session
          resetSchedule();
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, isFlashing, playSound, isScheduleActive, schedule, currentScheduleIndex, timerType, saveSessionToHistory, resetSchedule, scheduleTitle, currentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds]);

  // Initial time setting when focus/break minutes change
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  // Active Asks functions
  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks((prev) => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks((prev) =>
      prev.map((ask) => (ask.id === updatedAsk.id ? updatedAsk : ask))
    );
  }, []);

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
    seshTitle,
    setSeshTitle,
    formatTime,
    showSessionsWhileActive,
    setShowSessionsWhileActive,
    timerIncrement,

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
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
    isGlobalPrivate,
    setIsGlobalPrivate,

    sessionStartTime,
    setSessionStartTime,
    currentPhaseStartTime,
    setCurrentPhaseStartTime,
    accumulatedFocusSeconds,
    setAccumulatedFocusSeconds,
    accumulatedBreakSeconds,
    setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount,
    setActiveJoinedSessionCoworkerCount,
    saveSessionToHistory,

    activeAsks,
    addAsk,
    updateAsk,

    isSchedulePending,
    setIsSchedulePending,
    scheduleStartOption,
    setScheduleStartOption,
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