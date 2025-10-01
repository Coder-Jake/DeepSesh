import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer';
import { useProfile } from './ProfileContext';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { toast } = useToast();

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
  const [timerIncrement, setTimerIncrement] = useState(5); // Default increment

  // Scheduling states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState("09:00"); // HH:MM format
  const [commenceDay, setCommenceDay] = useState(0); // 0 for Sunday, 6 for Saturday
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isSchedulePending, setIsSchedulePending] = useState(false); // New state for pending schedule

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
  const [customBatchMinutes, setCustomBatchMinutes] = useState(10);
  const [lock, setLock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);
  const [manualTransition, setManualTransition] = useState(false);
  const [maxDistance, setMaxDistance] = useState(100);
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(true);
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [locationSharing, setLocationSharing] = useState(false);
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playEndSound = useCallback(() => {
    if (shouldPlayEndSound) {
      if (audioRef.current) {
        audioRef.current.play();
      } else {
        const audio = new Audio('/sounds/ding.mp3'); // Ensure you have a sound file here
        audio.play();
        audioRef.current = audio;
      }
    }
  }, [shouldPlayEndSound]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setIsFlashing(false);
    setSessionStartTime(Date.now());
    setCurrentPhaseStartTime(Date.now());
  }, []);

  const pauseTimer = useCallback(() => {
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        setAccumulatedFocusSeconds(prev => prev + elapsed);
      } else {
        setAccumulatedBreakSeconds(prev => prev + elapsed);
      }
      setCurrentPhaseStartTime(null);
    }
    setIsPaused(true);
    setIsRunning(false);
  }, [currentPhaseStartTime, timerType, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds]);

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
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setIsSchedulePending(false); // Reset pending state
  }, [focusMinutes, breakMinutes, timerType]);

  const saveSessionToHistory = useCallback(async () => {
    if (!profile?.id || !sessionStartTime) {
      console.warn("Cannot save session: User not logged in or session not started.");
      toast({
        title: "Session Not Saved",
        description: "Please log in to save your session history.",
        variant: "destructive",
      });
      return;
    }

    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        setAccumulatedFocusSeconds(prev => prev + elapsed);
      } else {
        setAccumulatedBreakSeconds(prev => prev + elapsed);
      }
    }

    const totalSessionSeconds = accumulatedFocusSeconds + accumulatedBreakSeconds;

    if (totalSessionSeconds === 0) {
      toast({
        title: "Session Too Short",
        description: "Session was too short to save.",
        variant: "default",
      });
      resetTimer();
      return;
    }

    // In a real app, you'd send this data to your backend (e.g., Supabase)
    console.log("Saving session to history:", {
      userId: profile.id,
      title: seshTitle,
      notes: notes,
      focusDurationSeconds: accumulatedFocusSeconds,
      breakDurationSeconds: accumulatedBreakSeconds,
      totalSessionSeconds: totalSessionSeconds,
      coworkerCount: activeJoinedSessionCoworkerCount,
      sessionStartTime: new Date(sessionStartTime).toISOString(),
      sessionEndTime: new Date().toISOString(),
      isScheduled: isScheduleActive,
      scheduleTitle: isScheduleActive ? scheduleTitle : undefined,
    });

    toast({
      title: "Session Saved!",
      description: `Your session "${seshTitle}" has been added to your history.`,
    });

    resetTimer();
  }, [profile?.id, sessionStartTime, currentPhaseStartTime, timerType, accumulatedFocusSeconds, accumulatedBreakSeconds, seshTitle, notes, activeJoinedSessionCoworkerCount, isScheduleActive, scheduleTitle, resetTimer, toast]);

  const startNextScheduledTimer = useCallback(() => {
    if (currentScheduleIndex < schedule.length) {
      const nextTimer = schedule[currentScheduleIndex];
      setTimerType(nextTimer.type);
      setTimeLeft(nextTimer.durationMinutes * 60);
      setSeshTitle(nextTimer.title);
      setFocusMinutes(nextTimer.type === 'focus' ? nextTimer.durationMinutes : focusMinutes);
      setBreakMinutes(nextTimer.type === 'break' ? nextTimer.durationMinutes : breakMinutes);
      setIsRunning(true);
      setIsPaused(false);
      setIsFlashing(false);
      setCurrentPhaseStartTime(Date.now()); // Start timer for this phase
      setCurrentScheduleIndex(prev => prev + 1);
    } else {
      // Schedule finished
      setIsScheduleActive(false);
      setCurrentScheduleIndex(0);
      saveSessionToHistory(); // Save the entire scheduled session
    }
  }, [currentScheduleIndex, schedule, focusMinutes, breakMinutes, saveSessionToHistory, setSeshTitle, setTimerType, setTimeLeft, setIsRunning, setIsPaused, setIsFlashing, setCurrentPhaseStartTime]);

  const startSchedule = useCallback(() => {
    if (schedule.length === 0) {
      toast({
        title: "No Timers",
        description: "Please add timers to your schedule.",
        variant: "destructive",
      });
      return;
    }

    // Calculate target start time
    const now = new Date();
    const [hours, minutes] = commenceTime.split(':').map(Number);
    
    // Create a target date for the *current* week/day
    const targetDateCandidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    const currentDay = now.getDay(); // 0 for Sunday, 6 for Saturday
    const daysOffset = (commenceDay - currentDay + 7) % 7;
    targetDateCandidate.setDate(now.getDate() + daysOffset);

    const timeUntilStart = targetDateCandidate.getTime() - now.getTime();
    const GRACE_PERIOD_MS = 60 * 1000; // 1 minute grace period

    // Determine if it should start immediately or go into pending countdown
    if (timeUntilStart <= GRACE_PERIOD_MS) { // If within 1 minute (future, now, or slightly in past)
      setIsSchedulePending(false); // Ensure pending is false
      setIsScheduleActive(true);
      setIsSchedulingMode(false);
      setCurrentScheduleIndex(0);
      setSessionStartTime(now.getTime()); // Overall session start is now
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      startNextScheduledTimer();
      toast({
        title: "Schedule Started!",
        description: `"${scheduleTitle}" has commenced.`,
      });
    } else {
      // If the calculated targetDateCandidate is in the past (and outside grace period),
      // it means the user selected a day/time that has already passed for the current week.
      // In this case, we should push it to the next week for the countdown.
      let finalTargetDate = new Date(targetDateCandidate);
      if (timeUntilStart < -GRACE_PERIOD_MS) { // If significantly in the past
        finalTargetDate.setDate(finalTargetDate.getDate() + 7);
      }

      setIsSchedulePending(true);
      setIsSchedulingMode(false);
      setIsScheduleActive(true); // Set active so Timeline can show countdown
      setCurrentScheduleIndex(0); // Reset index for when it actually starts
      setSessionStartTime(null); // Will be set when countdown ends
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      toast({
        title: "Schedule Pending",
        description: `"${scheduleTitle}" will commence at ${commenceTime} on ${new Date(finalTargetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}.`,
      });
    }
  }, [schedule, commenceTime, commenceDay, scheduleTitle, startNextScheduledTimer, toast]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setIsSchedulePending(false);
    resetTimer(); // Also reset the main timer states
  }, [resetTimer]);

  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks(prev => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks(prev => prev.map(ask => ask.id === updatedAsk.id ? updatedAsk : ask));
  }, []);

  // Main timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
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
          variant: timerType === 'focus' ? 'default' : 'success',
        });
      }

      if (isScheduleActive) {
        startNextScheduledTimer();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, timerType, isFlashing, isScheduleActive, startNextScheduledTimer, playEndSound, shouldShowEndToast, toast]);

  // Initialize timeLeft when focusMinutes or breakMinutes change
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending]);

  const value = {
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

    schedule, setSchedule,
    isSchedulingMode, setIsSchedulingMode,
    startSchedule,
    resetSchedule,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
    isRecurring, setIsRecurring,
    recurrenceFrequency, setRecurrenceFrequency,
    isScheduleActive,
    currentScheduleIndex,
    isSchedulePending, setIsSchedulePending,

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