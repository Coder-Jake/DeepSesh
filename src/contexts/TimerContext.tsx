import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Assuming you have a supabase client

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Scheduling states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState("09:00");
  const [commenceDay, setCommenceDay] = useState<number | null>(null); // Initialize as null for dynamic 'today'
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulePending, setIsSchedulePending] = useState(false);

  // Saved Schedules (Templates)
  const [savedSchedules, setSavedSchedules] = useState<ScheduledTimerTemplate[]>([]);

  // Core Timer states
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes");
  const [timerIncrement, setTimerIncrement] = useState(5);

  // Session management states
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Ask/Poll states
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]);

  // Settings states
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(true);
  const [shouldShowEndToast, setShouldShowEndToast] = useState(true);
  const [isBatchNotificationsEnabled, setIsBatchNotificationsEnabled] = useState(false);
  const [batchNotificationPreference, setBatchNotificationPreference] = useState<'break' | 'sesh_end' | 'custom'>('break');
  const [customBatchMinutes, setCustomBatchMinutes] = useState(15);
  const [lock, setLock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);
  const [manualTransition, setManualTransition] = useState(false);
  const [maxDistance, setMaxDistance] = useState(1000); // Default to 1km
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(true);
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [locationSharing, setLocationSharing] = useState(false);
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false); // Renamed from isGlobalPublic
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]); // For controlled accordion state

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const playEndSound = useCallback(() => {
    if (shouldPlayEndSound) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  }, [shouldPlayEndSound]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    const initialTime = timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
    setTimeLeft(initialTime);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setNotes("");
    setSeshTitle("Notes");
  }, [focusMinutes, breakMinutes, timerType]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setIsSchedulingMode(false);
    setIsSchedulePending(false);
    resetTimer(); // Reset the individual timer as well
  }, [resetTimer]);

  const startSchedule = useCallback(() => {
    if (schedule.length === 0) {
      toast({
        title: "No Timers in Schedule",
        description: "Please add at least one timer to your schedule.",
        variant: "destructive",
      });
      return;
    }

    setIsSchedulingMode(false); // Exit scheduling mode
    setIsScheduleActive(true);
    setCurrentScheduleIndex(0);

    if (scheduleStartOption === 'custom_time') {
      setIsSchedulePending(true);
      setIsRunning(false); // Timer is not running yet, it's pending
      setIsPaused(false);
      setTimeLeft(0); // Timeline will handle its own countdown
    } else {
      setIsSchedulePending(false);
      const firstTimer = schedule[0];
      setTimerType(firstTimer.type);
      setTimeLeft(firstTimer.durationMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setSessionStartTime(Date.now());
      setCurrentPhaseStartTime(Date.now());
      playEndSound(); // Play sound when schedule starts immediately
    }
  }, [schedule, scheduleStartOption, toast, playEndSound]);

  const saveSessionToHistory = useCallback(async () => {
    if (sessionStartTime === null || currentPhaseStartTime === null) {
      // Session hasn't properly started or is already saved/reset
      return;
    }

    // Calculate elapsed time for the current phase before saving
    const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
    let finalAccumulatedFocus = accumulatedFocusSeconds;
    let finalAccumulatedBreak = accumulatedBreakSeconds;

    if (timerType === 'focus') {
      finalAccumulatedFocus += elapsed;
    } else {
      finalAccumulatedBreak += elapsed;
    }

    const totalSessionSeconds = finalAccumulatedFocus + finalAccumulatedBreak;

    if (totalSessionSeconds === 0) {
      // Don't save empty sessions
      resetTimer();
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: seshTitle,
          notes: notes,
          focus_duration_seconds: finalAccumulatedFocus,
          break_duration_seconds: finalAccumulatedBreak,
          total_session_seconds: totalSessionSeconds,
          coworker_count: activeJoinedSessionCoworkerCount,
          session_start_time: new Date(sessionStartTime).toISOString(),
          session_end_time: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving session:', error);
        toast({
          title: "Error Saving Session",
          description: "Could not save your session history.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Session Saved!",
          description: "Your session has been added to history.",
        });
      }
    } else {
      toast({
        title: "Not Logged In",
        description: "Log in to save your session history.",
        variant: "destructive",
      });
    }
    resetTimer();
    resetSchedule();
  }, [
    sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    timerType, seshTitle, notes, activeJoinedSessionCoworkerCount, toast, resetTimer, resetSchedule
  ]);

  const saveCurrentScheduleAsTemplate = useCallback(() => {
    if (!scheduleTitle.trim()) {
      toast({
        title: "Template Title Missing",
        description: "Please enter a title for your schedule template.",
        variant: "destructive",
      });
      return;
    }

    // Get current day index (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const currentDay = new Date().getDay();
    // Adjust to match new daysOfWeek array (0 for Monday, ..., 6 for Sunday)
    const adjustedCurrentDayIndex = (currentDay === 0) ? 6 : currentDay - 1;

    const templateToSave: ScheduledTimerTemplate = {
      id: crypto.randomUUID(),
      title: scheduleTitle,
      schedule: schedule,
      commenceTime: commenceTime,
      // Save as null if it's the current day (dynamic 'today') or if it's already null
      commenceDay: (commenceDay === null || commenceDay === adjustedCurrentDayIndex) ? null : commenceDay,
      scheduleStartOption: scheduleStartOption,
      isRecurring: isRecurring,
      recurrenceFrequency: recurrenceFrequency,
    };
    setSavedSchedules((prev) => [...prev, templateToSave]);
    toast({
      title: "Schedule Saved!",
      description: `"${scheduleTitle}" has been saved as a template.`,
    });
  }, [scheduleTitle, schedule, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency, setSavedSchedules, toast]);

  const loadScheduleTemplate = useCallback((templateId: string) => {
    const template = savedSchedules.find(t => t.id === templateId);
    if (template) {
      setScheduleTitle(template.title);
      setSchedule(template.schedule);
      setCommenceTime(template.commenceTime);
      setCommenceDay(template.commenceDay); // Will be null if it was saved as dynamic 'today'
      setScheduleStartOption(template.scheduleStartOption);
      setIsRecurring(template.isRecurring);
      setRecurrenceFrequency(template.recurrenceFrequency);
      toast({
        title: "Template Loaded!",
        description: `"${template.title}" has been loaded.`,
      });
    }
  }, [savedSchedules, setScheduleTitle, setSchedule, setCommenceTime, setCommenceDay, setScheduleStartOption, setIsRecurring, setRecurrenceFrequency, toast]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "The schedule template has been removed.",
    });
  }, [setSavedSchedules, toast]);

  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks((prev) => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks((prev) => prev.map(ask => ask.id === updatedAsk.id ? updatedAsk : ask));
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      clearInterval(intervalRef.current!);
      setIsRunning(false);
      setIsFlashing(true);
      playEndSound();

      if (shouldShowEndToast) {
        toast({
          title: `${timerType === 'focus' ? 'Focus' : 'Break'} Time Ended!`,
          description: `Your ${timerType} session has concluded.`,
        });
      }

      // Handle schedule progression
      if (isScheduleActive) {
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < schedule.length) {
          const nextTimer = schedule[nextIndex];
          setCurrentScheduleIndex(nextIndex);
          setTimerType(nextTimer.type);
          setTimeLeft(nextTimer.durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          // Accumulate time for the phase just ended
          if (currentPhaseStartTime !== null) {
            const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
            if (schedule[currentScheduleIndex].type === 'focus') {
              setAccumulatedFocusSeconds((prev) => prev + elapsed);
            } else {
              setAccumulatedBreakSeconds((prev) => prev + elapsed);
            }
          }
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          // Schedule finished
          saveSessionToHistory(); // Save the entire scheduled session
          resetSchedule();
        }
      } else {
        // Regular timer finished, save it
        saveSessionToHistory();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isRunning, timeLeft, timerType, isScheduleActive, currentScheduleIndex, schedule,
    playEndSound, shouldShowEndToast, toast, saveSessionToHistory, resetSchedule,
    currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds
  ]);

  // Effect to update time left when focus/break minutes change (only if not running/paused/scheduled)
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  const value = {
    schedule, setSchedule,
    isSchedulingMode, setIsSchedulingMode,
    startSchedule,
    resetSchedule,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
    scheduleStartOption, setScheduleStartOption,
    isRecurring, setIsRecurring,
    recurrenceFrequency, setRecurrenceFrequency,
    isScheduleActive,
    currentScheduleIndex,
    isSchedulePending, setIsSchedulePending,

    savedSchedules, saveCurrentScheduleAsTemplate, loadScheduleTemplate, deleteScheduleTemplate,

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
    timerIncrement, setTimerIncrement,

    showSessionsWhileActive, setShowSessionsWhileActive,
    sessionStartTime, setSessionStartTime,
    currentPhaseStartTime, setCurrentPhaseStartTime,
    accumulatedFocusSeconds, setAccumulatedFocusSeconds,
    accumulatedBreakSeconds, setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount,
    saveSessionToHistory,

    activeAsks, addAsk, updateAsk,

    shouldPlayEndSound, setShouldPlayEndSound,
    shouldShowEndToast, setShouldShowEndToast,
    isBatchNotificationsEnabled, setIsBatchNotificationsEnabled,
    batchNotificationPreference, setBatchNotificationPreference,
    customBatchMinutes, setCustomBatchMinutes,
    lock, setLock,
    exemptionsEnabled, setExemptionsEnabled,
    phoneCalls, setPhoneCalls,
    favourites, setFavourites,
    workApps, setWorkApps,
    intentionalBreaches, setIntentionalBreaches,
    manualTransition, setManualTransition,
    maxDistance, setMaxDistance,
    askNotifications, setAskNotifications,
    sessionInvites, setSessionInvites,
    friendActivity, setFriendActivity,
    breakNotificationsVibrate, setBreakNotificationsVibrate,
    verificationStandard, setVerificationStandard,
    profileVisibility, setProfileVisibility,
    locationSharing, setLocationSharing,
    isGlobalPrivate, setIsGlobalPrivate,
    openSettingsAccordions, setOpenSettingsAccordions,
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