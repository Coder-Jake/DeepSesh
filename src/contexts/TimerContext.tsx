import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer } from '@/types/timer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext'; // Import useAuth
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

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
  setTimeLeft: (seconds: number) => void;
  timerType: 'focus' | 'break';
  setTimerType: (type: 'focus' | 'break') => void;
  isFlashing: boolean;
  setIsFlashing: (flashing: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;
  seshTitle: string;
  setSeshTitle: (title: string) => void;
  formatTime: (seconds: number) => string;
  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: (show: boolean) => void;
  timerIncrement: number;

  // Schedule-related states and functions
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
  scheduleTitle: string;
  setScheduleTitle: (title: string) => void;
  commenceTime: string;
  setCommenceTime: (time: string) => void;
  commenceDay: number;
  setCommenceDay: (day: number) => void;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: (isPrivate: boolean) => void;

  // Session tracking states
  sessionStartTime: number | null;
  setSessionStartTime: (time: number | null) => void;
  currentPhaseStartTime: number | null;
  setCurrentPhaseStartTime: (time: number | null) => void;
  accumulatedFocusSeconds: number;
  setAccumulatedFocusSeconds: (seconds: number) => void;
  accumulatedBreakSeconds: number;
  setAccumulatedBreakSeconds: (seconds: number) => void;
  activeJoinedSessionCoworkerCount: number;
  setActiveJoinedSessionCoworkerCount: (count: number) => void;
  saveSessionToHistory: () => Promise<void>;

  // Active Asks states and functions
  activeAsks: any[]; // Using 'any' for now, will refine with specific types later
  addAsk: (ask: any) => void;
  updateAsk: (ask: any) => void;

  // New: Schedule pending state
  isSchedulePending: boolean;
  setIsSchedulePending: (pending: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes");
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(true);
  const timerIncrement = 5; // Default increment for timer settings

  // Schedule states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState("09:00"); // Default to 9 AM
  const [commenceDay, setCommenceDay] = useState(new Date().getDay()); // Default to current day
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);

  // Session tracking states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Active Asks state
  const [activeAsks, setActiveAsks] = useState<any[]>([]); // Using 'any' for now

  // New: Schedule pending state
  const [isSchedulePending, setIsSchedulePending] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const saveSessionToHistory = useCallback(async () => {
    if (!user || !sessionStartTime || !currentPhaseStartTime) {
      console.log("Skipping session save: User not logged in or session not started.");
      return;
    }

    // Accumulate time for the phase that just ended or was stopped
    const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
    let finalAccumulatedFocus = accumulatedFocusSeconds;
    let finalAccumulatedBreak = accumulatedBreakSeconds;

    if (timerType === 'focus') {
      finalAccumulatedFocus += elapsed;
    } else {
      finalAccumulatedBreak += elapsed;
    }

    const totalSessionSeconds = (Date.now() - sessionStartTime) / 1000;

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
      console.error("Error saving session:", error);
      toast({
        title: "Error saving session",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Session saved:", data);
      toast({
        title: "Session saved!",
        description: "Your session has been added to your history.",
      });
    }

    // Reset session tracking states after saving
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setActiveJoinedSessionCoworkerCount(0);
    setNotes("");
    setSeshTitle("Notes");
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimeLeft(focusMinutes * 60); // Reset to initial focus time
    setTimerType('focus');
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setIsSchedulePending(false); // Reset pending state
  }, [user, sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds, timerType, seshTitle, notes, activeJoinedSessionCoworkerCount, focusMinutes, toast]);


  const startSchedule = useCallback(() => {
    if (schedule.length === 0) return;

    const now = new Date();
    const commenceDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                      parseInt(commenceTime.split(':')[0]), parseInt(commenceTime.split(':')[1]));
    
    const currentDay = now.getDay();
    let diff = commenceDay - currentDay;
    commenceDateTime.setDate(commenceDateTime.getDate() + diff);

    // If the commence time has already passed for the selected day, move to next week
    if (commenceDateTime.getTime() < now.getTime() && diff <= 0) {
      commenceDateTime.setDate(commenceDateTime.getDate() + 7);
    }

    const isFutureCommencement = commenceDateTime.getTime() > now.getTime();

    setIsScheduleActive(true);
    setCurrentScheduleIndex(0);
    setTimerType(schedule[0].type);
    setTimeLeft(schedule[0].durationMinutes * 60);
    setIsSchedulingMode(false);
    setSessionStartTime(Date.now()); // Overall session start time
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);

    if (isFutureCommencement) {
      setIsRunning(false);
      setIsPaused(true); // Timer is paused until commencement
      setIsSchedulePending(true); // Mark schedule as pending
      toast({
        title: "Schedule Set!",
        description: `Your schedule will commence on ${new Date(commenceDateTime).toLocaleDateString()} at ${new Date(commenceDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      });
    } else {
      setIsRunning(true);
      setIsPaused(false);
      setIsSchedulePending(false); // Not pending, starts now
      setCurrentPhaseStartTime(Date.now()); // Current phase starts now
      playSound();
    }
  }, [schedule, commenceTime, commenceDay, playSound, toast]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimeLeft(focusMinutes * 60);
    setTimerType('focus');
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setIsSchedulePending(false); // Reset pending state
  }, [focusMinutes]);

  useEffect(() => {
    if (isRunning && !isPaused && !isSchedulePending) { // Only run if not pending
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current!);
            playSound();
            setIsFlashing(true);

            // Accumulate time for the phase that just ended
            if (currentPhaseStartTime !== null) {
              const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
              if (timerType === 'focus') {
                setAccumulatedFocusSeconds(prev => prev + elapsed);
              } else {
                setAccumulatedBreakSeconds(prev => prev + elapsed);
              }
            }

            if (isScheduleActive) {
              const nextIndex = currentScheduleIndex + 1;
              if (nextIndex < schedule.length) {
                setCurrentScheduleIndex(nextIndex);
                setTimerType(schedule[nextIndex].type);
                setTimeLeft(schedule[nextIndex].durationMinutes * 60);
                setIsFlashing(false);
                setCurrentPhaseStartTime(Date.now()); // Start new phase timer
                return schedule[nextIndex].durationMinutes * 60;
              } else {
                // Schedule finished
                saveSessionToHistory(); // Save the completed schedule
                setIsScheduleActive(false);
                setCurrentScheduleIndex(0);
                setIsRunning(false);
                setIsPaused(false);
                setTimerType('focus');
                setTimeLeft(focusMinutes * 60);
                setIsFlashing(false);
                return 0;
              }
            } else {
              // Regular timer finished
              setIsRunning(false);
              setIsPaused(true); // Pause after completion
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, isScheduleActive, currentScheduleIndex, schedule, timerType, focusMinutes, playSound, saveSessionToHistory, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds, isSchedulePending]);

  // Initialize timeLeft when focusMinutes or breakMinutes change and timer is not running/paused
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  const addAsk = useCallback((ask: any) => {
    setActiveAsks(prev => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: any) => {
    setActiveAsks(prev => prev.map(ask => ask.id === updatedAsk.id ? updatedAsk : ask));
  }, []);

  return (
    <TimerContext.Provider
      value={{
        focusMinutes, setFocusMinutes,
        breakMinutes, setBreakMinutes,
        isRunning, setIsRunning,
        isPaused, setIsPaused,
        timeLeft, setTimeLeft,
        timerType, setTimerType,
        isFlashing, setIsFlashing,
        notes, setNotes,
        seshTitle, setSeshTitle,
        formatTime,
        showSessionsWhileActive, setShowSessionsWhileActive,
        timerIncrement,

        schedule, setSchedule,
        currentScheduleIndex, setCurrentScheduleIndex,
        isSchedulingMode, setIsSchedulingMode,
        isScheduleActive, setIsScheduleActive,
        startSchedule,
        resetSchedule,
        scheduleTitle, setScheduleTitle,
        commenceTime, setCommenceTime,
        commenceDay, setCommenceDay,
        isGlobalPrivate, setIsGlobalPrivate,

        sessionStartTime, setSessionStartTime,
        currentPhaseStartTime, setCurrentPhaseStartTime,
        accumulatedFocusSeconds, setAccumulatedFocusSeconds,
        accumulatedBreakSeconds, setAccumulatedBreakSeconds,
        activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount,
        saveSessionToHistory,

        activeAsks, addAsk, updateAsk,
        isSchedulePending, setIsSchedulePending,
      }}
    >
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