"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer';
import { useProfile } from './ProfileContext'; // Import useProfile
import { useToast } from '@/hooks/use-toast'; // Import shadcn toast

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { saveSession: saveSessionToProfileHistory, profile, localFirstName } = useProfile();
  const { toast } = useToast();

  // Core Timer States
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus'); // 'focus' or 'break'
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes");
  const [timerIncrement, setTimerIncrement] = useState(5); // Changed to state variable

  // Session Management States
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Scheduling States
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [scheduleTitle, setScheduleTitle] = useState("My Schedule");
  const [commenceTime, setCommenceTime] = useState("");
  const [commenceDay, setCommenceDay] = useState(new Date().getDay());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isSchedulePending, setIsSchedulePending] = useState(false);

  // Active Asks States
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]);

  // Settings States
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(true);
  const [shouldShowEndToast, setShouldShowEndToast] = useState(true);
  const [isBatchNotificationsEnabled, setIsBatchNotificationsEnabled] = useState(false);
  const [batchNotificationPreference, setBatchNotificationPreference] = useState<'break' | 'sesh_end' | 'custom'>('break');
  const [customBatchMinutes, setCustomBatchMinutes] = useState(timerIncrement);
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
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]); // For persistent accordion state

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility to format time
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Function to play sound
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

  // Function to show toast notification
  const showEndToast = useCallback((message: string) => {
    if (shouldShowEndToast) {
      toast({
        title: message,
        description: "Time to switch!",
      });
    }
  }, [shouldShowEndToast, toast]);

  // Save session data to history
  const saveSession = useCallback(async () => {
    if (sessionStartTime === null) return;

    // Accumulate any remaining time in the current phase before stopping
    if (currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        setAccumulatedFocusSeconds(prev => prev + elapsed);
      } else {
        setAccumulatedBreakSeconds(prev => prev + elapsed);
      }
    }

    const finalAccumulatedFocusSeconds = accumulatedFocusSeconds + (timerType === 'focus' && currentPhaseStartTime !== null ? (Date.now() - currentPhaseStartTime) / 1000 : 0);
    const finalAccumulatedBreakSeconds = accumulatedBreakSeconds + (timerType === 'break' && currentPhaseStartTime !== null ? (Date.now() - currentPhaseStartTime) / 1000 : 0);
    const totalSessionSeconds = (Date.now() - sessionStartTime) / 1000;

    await saveSessionToProfileHistory(
      seshTitle,
      notes,
      finalAccumulatedFocusSeconds,
      finalAccumulatedBreakSeconds,
      totalSessionSeconds,
      activeJoinedSessionCoworkerCount,
      sessionStartTime,
    );

    // Reset all timer states
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType('focus');
    setNotes("");
    setSeshTitle("Notes");
    setTimeLeft(focusMinutes * 60);
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setActiveJoinedSessionCoworkerCount(0);
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setIsSchedulePending(false);
    setSchedule([]);
  }, [
    sessionStartTime, currentPhaseStartTime, timerType, accumulatedFocusSeconds, accumulatedBreakSeconds,
    saveSessionToProfileHistory, seshTitle, notes, activeJoinedSessionCoworkerCount, focusMinutes
  ]);

  // Schedule management functions
  const startScheduleHandler = useCallback(() => {
    if (schedule.length === 0) return;

    setIsSchedulingMode(false);
    setIsScheduleActive(true);
    setCurrentScheduleIndex(0);
    setIsSchedulePending(true); // Set pending state

    // Reset main timer states
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType(schedule[0].type);
    setTimeLeft(schedule[0].durationMinutes * 60);
    setNotes("");
    setSeshTitle(scheduleTitle);
    setSessionStartTime(null); // Will be set when countdown ends
    setCurrentPhaseStartTime(null); // Will be set when countdown ends
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
  }, [schedule, setIsSchedulingMode, scheduleTitle]);

  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setIsSchedulePending(false);
    setSchedule([]);
    setScheduleTitle("My Schedule");
    setCommenceTime("");
    setCommenceDay(new Date().getDay());
    setIsRecurring(false);
    setRecurrenceFrequency('daily');
    // Also reset main timer if it was running due to schedule
    if (isRunning || isPaused || isFlashing) {
      saveSession(); // Save current session if any
    }
  }, [isRunning, isPaused, isFlashing, saveSession]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer ended
      clearInterval(intervalRef.current!);
      intervalRef.current = null;
      playEndSound();
      showEndToast(`${timerType === 'focus' ? 'Focus' : 'Break'} session ended!`);
      setIsFlashing(true);

      // Accumulate time for the phase just ended
      if (currentPhaseStartTime !== null) {
        const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
        if (timerType === 'focus') {
          setAccumulatedFocusSeconds(prev => prev + elapsed);
        } else {
          setAccumulatedBreakSeconds(prev => prev + elapsed);
        }
        setCurrentPhaseStartTime(null); // Reset phase start time
      }

      if (isScheduleActive) {
        // Handle scheduled session transition
        const nextIndex = currentScheduleIndex + 1;
        if (nextIndex < schedule.length) {
          const nextItem = schedule[nextIndex];
          setTimerType(nextItem.type);
          setTimeLeft(nextItem.durationMinutes * 60);
          setCurrentScheduleIndex(nextIndex);
          setIsRunning(true);
          setIsPaused(false);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          // Schedule completed
          saveSession(); // Save the entire scheduled session
        }
      } else if (!manualTransition) {
        // Auto-transition for non-scheduled, non-manual sessions
        if (timerType === 'focus') {
          setTimerType('break');
          setTimeLeft(breakMinutes * 60);
        } else {
          setTimerType('focus');
          setTimeLeft(focusMinutes * 60);
        }
        setIsRunning(true);
        setIsPaused(false);
        setIsFlashing(false);
        setCurrentPhaseStartTime(Date.now()); // Start new phase timer
      } else {
        // Manual transition: pause and wait for user input
        setIsRunning(false);
        setIsPaused(true);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isRunning, timeLeft, timerType, focusMinutes, breakMinutes, isFlashing,
    playEndSound, showEndToast, manualTransition, isScheduleActive, schedule,
    currentScheduleIndex, saveSession, currentPhaseStartTime, accumulatedFocusSeconds,
    accumulatedBreakSeconds
  ]);

  // Update timeLeft when focusMinutes or breakMinutes change, but only if not running/paused/flashing
  useEffect(() => {
    if (!isRunning && !isPaused && !isFlashing && !isScheduleActive) {
      if (timerType === 'focus') {
        setTimeLeft(focusMinutes * 60);
      } else {
        setTimeLeft(breakMinutes * 60);
      }
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isFlashing, isScheduleActive]);

  // Load settings from local storage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('flowsesh_settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setFocusMinutes(settings.focusMinutes ?? 25);
      setBreakMinutes(settings.breakMinutes ?? 5);
      setShowSessionsWhileActive(settings.showSessionsWhileActive ?? true);
      setShouldPlayEndSound(settings.shouldPlayEndSound ?? true);
      setShouldShowEndToast(settings.shouldShowEndToast ?? true);
      setIsBatchNotificationsEnabled(settings.isBatchNotificationsEnabled ?? false);
      setBatchNotificationPreference(settings.batchNotificationPreference ?? 'break');
      setCustomBatchMinutes(settings.customBatchMinutes ?? timerIncrement);
      setLock(settings.lock ?? false);
      setExemptionsEnabled(settings.exemptionsEnabled ?? false);
      setPhoneCalls(settings.phoneCalls ?? false);
      setFavourites(settings.favourites ?? false);
      setWorkApps(settings.workApps ?? false);
      setIntentionalBreaches(settings.intentionalBreaches ?? false);
      setManualTransition(settings.manualTransition ?? false);
      setMaxDistance(settings.maxDistance ?? 1000);
      setAskNotifications(settings.askNotifications ?? { push: true, vibrate: true, sound: true });
      setSessionInvites(settings.sessionInvites ?? { push: true, vibrate: true, sound: true });
      setFriendActivity(settings.friendActivity ?? { push: true, vibrate: true, sound: true });
      setBreakNotificationsVibrate(settings.breakNotificationsVibrate ?? true);
      setVerificationStandard(settings.verificationStandard ?? 'anyone');
      setProfileVisibility(settings.profileVisibility ?? 'public');
      setLocationSharing(settings.locationSharing ?? false);
      setIsGlobalPrivate(settings.isGlobalPrivate ?? false);
      setOpenSettingsAccordions(settings.openSettingsAccordions ?? []);
      setSeshTitle(settings.seshTitle ?? "Notes");
      setNotes(settings.notes ?? "");
      setSchedule(settings.schedule ?? []);
      setIsScheduleActive(settings.isScheduleActive ?? false);
      setCurrentScheduleIndex(settings.currentScheduleIndex ?? 0);
      setScheduleTitle(settings.scheduleTitle ?? "My Schedule");
      setCommenceTime(settings.commenceTime ?? "");
      setCommenceDay(settings.commenceDay ?? new Date().getDay());
      setIsRecurring(settings.isRecurring ?? false);
      setRecurrenceFrequency(settings.recurrenceFrequency ?? 'daily');
      setIsSchedulePending(settings.isSchedulePending ?? false);
      setTimerType(settings.timerType ?? 'focus');
      setTimeLeft(settings.timeLeft ?? (settings.focusMinutes ?? 25) * 60);
      setIsRunning(settings.isRunning ?? false);
      setIsPaused(settings.isPaused ?? false);
      setIsFlashing(settings.isFlashing ?? false);
      setSessionStartTime(settings.sessionStartTime ?? null);
      setCurrentPhaseStartTime(settings.currentPhaseStartTime ?? null);
      setAccumulatedFocusSeconds(settings.accumulatedFocusSeconds ?? 0);
      setAccumulatedBreakSeconds(settings.accumulatedBreakSeconds ?? 0);
      setActiveJoinedSessionCoworkerCount(settings.activeJoinedSessionCoworkerCount ?? 0);
      setActiveAsks(settings.activeAsks ?? []);
      setTimerIncrement(settings.timerIncrement ?? 5); // Load timerIncrement
    }
  }, []);

  // Save settings to local storage whenever they change
  useEffect(() => {
    const settingsToSave = {
      focusMinutes,
      breakMinutes,
      showSessionsWhileActive,
      shouldPlayEndSound,
      shouldShowEndToast,
      isBatchNotificationsEnabled,
      batchNotificationPreference,
      customBatchMinutes,
      lock,
      exemptionsEnabled,
      phoneCalls,
      favourites,
      workApps,
      intentionalBreaches,
      manualTransition,
      maxDistance,
      askNotifications,
      sessionInvites,
      friendActivity,
      breakNotificationsVibrate,
      verificationStandard,
      profileVisibility,
      locationSharing,
      isGlobalPrivate,
      openSettingsAccordions,
      seshTitle,
      notes,
      schedule,
      isScheduleActive,
      currentScheduleIndex,
      scheduleTitle,
      commenceTime,
      commenceDay,
      isRecurring,
      recurrenceFrequency,
      isSchedulePending,
      timerType,
      timeLeft,
      isRunning,
      isPaused,
      isFlashing,
      sessionStartTime,
      currentPhaseStartTime,
      accumulatedFocusSeconds,
      accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount,
      activeAsks,
      timerIncrement, // Save timerIncrement
    };
    localStorage.setItem('flowsesh_settings', JSON.stringify(settingsToSave));
  }, [
    focusMinutes, breakMinutes, showSessionsWhileActive, shouldPlayEndSound, shouldShowEndToast,
    isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes, lock,
    exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches, manualTransition,
    maxDistance, askNotifications, sessionInvites, friendActivity, breakNotificationsVibrate,
    verificationStandard, profileVisibility, locationSharing, isGlobalPrivate, openSettingsAccordions,
    seshTitle, notes, schedule, isScheduleActive, currentScheduleIndex, scheduleTitle, commenceTime,
    commenceDay, isRecurring, recurrenceFrequency, isSchedulePending, timerType, timeLeft, isRunning,
    isPaused, isFlashing, sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds,
    accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, activeAsks, timerIncrement,
  ]);

  // Ask/Poll functions
  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks(prev => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks(prev => prev.map(ask => ask.id === updatedAsk.id ? updatedAsk : ask));
  }, []);

  const value = {
    // Core Timer States & Functions
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
    timerIncrement, setTimerIncrement, // Expose setTimerIncrement

    // Session Management States & Functions
    showSessionsWhileActive, setShowSessionsWhileActive,
    sessionStartTime, setSessionStartTime,
    currentPhaseStartTime, setCurrentPhaseStartTime,
    accumulatedFocusSeconds, setAccumulatedFocusSeconds,
    accumulatedBreakSeconds, setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount,
    saveSessionToHistory: saveSession, // Renamed for clarity in Index.tsx

    // Scheduling States & Functions
    schedule, setSchedule,
    isSchedulingMode, setIsSchedulingMode,
    startSchedule: startScheduleHandler, // Use the handler
    resetSchedule,
    isScheduleActive,
    currentScheduleIndex,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
    isRecurring, setIsRecurring,
    recurrenceFrequency, setRecurrenceFrequency,
    isSchedulePending, setIsSchedulePending,

    // Ask/Poll States & Functions
    activeAsks, addAsk, updateAsk,

    // Settings States & Functions
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