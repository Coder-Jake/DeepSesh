import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { ScheduledTimer, ScheduledTimerTemplate, TimerContextType, ActiveAskItem, NotificationSettings } from '@/types/timer'; // Import all types
import { toast } from '@/hooks/use-toast'; // Using shadcn toast for UI feedback
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { DEFAULT_SCHEDULE_TEMPLATES } from '@/lib/default-schedules'; // Import default templates
import { useProfile } from './ProfileContext'; // Import useProfile

export const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_TIMER = 'deepsesh_timer_context'; // New local storage key for TimerContext

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Get user from AuthContext
  const { saveSession } = useProfile(); // Get saveSession from useProfile

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
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(false); // Changed default to false
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule related states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false); // True when schedule is actively running/paused as part of its execution
  const [isSchedulePrepared, setIsSchedulePrepared] = useState(false); // NEW: True when a schedule is set for later, but not actively running
  const [scheduleTitle, setScheduleTitle] = useState("My Focus Sesh");
  const [commenceTime, setCommenceTime] = useState(""); // Changed default to empty string
  const [commenceDay, setCommenceDay] = useState<number | null>(null); // 0 for Sunday, 1 for Monday, etc.
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false); // Added
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily'); // Added

  // Snapshot of the schedule when it's active or prepared
  const [activeSchedule, setActiveSchedule] = useState<ScheduledTimer[]>([]); // NEW
  const [activeTimerColors, setActiveTimerColors] = useState<Record<string, string>>({}); // NEW

  // Saved Schedules (Templates)
  const [savedSchedules, setSavedSchedules] = useState<ScheduledTimerTemplate[]>([]); // Added
  
  // Timer Colors
  const [timerColors, setTimerColors] = useState<Record<string, string>>({}); // NEW

  // New session tracking states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Active Asks state
  const [activeAsks, setActiveAsks] = useState<ActiveAskItem[]>([]
  );

  // Schedule pending state
  const [isSchedulePending, setIsSchedulePending] = useState(false);
  const [scheduleStartOption, setScheduleStartOption] = useState<'now' | 'manual' | 'custom_time'>('now'); // Added 'manual'

  // Settings states
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(false); // Changed default to false
  const [shouldShowEndToast, setShouldShowEndToast] = useState(false); // Changed default to false
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
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: false, vibrate: false, sound: false }); // Changed default to false
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(false); // Changed default to false
  const [verificationStandard, setVerificationStandard] = useState<'anyone' | 'phone1' | 'organisation' | 'id1'>('anyone');
  const [profileVisibility, setProfileVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']); // Updated to array
  const [locationSharing, setLocationSharing] = useState(false);
  const [openSettingsAccordions, setOpenSettingsAccordions] = useState<string[]>([]); // Added

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

    let timeParts: string[] = [];

    if (days > 0) {
      timeParts.push(`${days}d`);
      timeParts.push(pad(hours));
      timeParts.push(pad(minutes));
      timeParts.push(pad(seconds));
      return `${timeParts[0]} ${timeParts.slice(1).join(':')}`;
    } else if (hours > 0) {
      timeParts.push(pad(hours));
      timeParts.push(pad(minutes));
      timeParts.push(pad(seconds));
      return timeParts.join(':');
    } else if (minutes > 0) {
      timeParts.push(pad(minutes));
      timeParts.push(pad(seconds));
      return timeParts.join(':');
    } else {
      // Only seconds or zero
      return `00:${pad(seconds)}`;
    }
  }, []);

  const startSchedule = useCallback(() => {
    if (schedule.length > 0) {
      // Reset manual timer states if a manual timer was running/paused
      // This ensures a clean slate for the schedule, unless it's a later-starting schedule
      // and a manual timer is currently running.
      if (scheduleStartOption === 'now' || (!isRunning && !isPaused)) {
        setIsRunning(false);
        setIsPaused(false);
        setIsFlashing(false);
        setAccumulatedFocusSeconds(0);
        setAccumulatedBreakSeconds(0);
        setNotes("");
        setSeshTitle("Notes");
      }

      // Take a snapshot of the current schedule and its colors
      setActiveSchedule([...schedule]);
      setActiveTimerColors({ ...timerColors });

      setCurrentScheduleIndex(0);
      setTimerType(schedule[0].type);
      setTimeLeft(schedule[0].durationMinutes * 60);
      setIsFlashing(false);
      setSessionStartTime(Date.now()); // Record overall session start time for the schedule
      setIsSchedulingMode(false); // Exit scheduling mode

      if (scheduleStartOption === 'custom_time') {
        setIsSchedulePrepared(true); // Schedule is prepared, but not active yet
        setIsScheduleActive(false); // Not actively running
        setIsSchedulePending(true); // For countdown
        setIsRunning(false); // Not running yet
        setIsPaused(true); // Paused until countdown ends
        setCurrentPhaseStartTime(null); // No phase started yet
        toast({
          title: "Schedule Prepared!",
          description: `"${scheduleTitle}" will begin at the scheduled time.`,
        });
      } else if (scheduleStartOption === 'manual') {
        setIsSchedulePrepared(true); // Schedule is prepared, but not active yet
        setIsScheduleActive(false); // Not actively running
        setIsRunning(false); // Not running yet
        setIsPaused(true); // Paused, waiting for user to hit 'Start'
        setCurrentPhaseStartTime(null); // No phase started yet
        toast({
          title: "Schedule Prepared!",
          description: `"${scheduleTitle}" is ready. Hit 'Start' to begin.`,
        });
      } else { // 'now'
        setIsSchedulePrepared(false); // Not just prepared, it's starting now
        setIsScheduleActive(true); // Start immediately
        setIsRunning(true);
        setIsPaused(false);
        setCurrentPhaseStartTime(Date.now());
        toast({
          title: "Schedule Started!",
          description: `"${scheduleTitle}" has begun.`,
        });
      }
    }
  }, [schedule, scheduleTitle, scheduleStartOption, isRunning, isPaused, timerColors]);

  const commencePreparedSchedule = useCallback(() => {
    if (!isSchedulePrepared) return; // Only commence if a schedule is prepared

    // If a manual timer is running, prompt to override
    if (isRunning || isPaused) { // Check for any active manual timer state
      if (!confirm("A manual timer is currently active. Do you want to override it and start the prepared schedule?")) {
        return;
      }
      // If confirmed, stop the manual timer
      setIsRunning(false);
      setIsPaused(false);
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
      setNotes("");
      setSeshTitle("Notes");
    }

    // Now, actually start the prepared schedule
    setIsSchedulePrepared(false); // No longer just prepared, it's active
    setIsScheduleActive(true); // Now it's actively running
    setIsRunning(true);
    setIsPaused(false);
    setCurrentPhaseStartTime(Date.now()); // Start the first phase timer
    toast({
      title: "Schedule Commenced!",
      description: `"${scheduleTitle}" has begun.`,
    });
  }, [isSchedulePrepared, isRunning, isPaused, scheduleTitle]);


  const resetSchedule = useCallback(() => {
    setIsScheduleActive(false);
    setIsSchedulePrepared(false); // Reset prepared state too
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setScheduleTitle("My Focus Sesh");
    setCommenceTime(""); // Changed to empty string
    setCommenceDay(null);
    setIsSchedulePending(false);
    setScheduleStartOption('now');
    setIsRecurring(false); // Reset recurrence
    setRecurrenceFrequency('daily'); // Reset recurrence frequency
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
    setTimerColors({}); // Reset timer colors
    setActiveSchedule([]); // NEW: Clear active schedule
    setActiveTimerColors({}); // NEW: Clear active timer colors
  }, [focusMinutes]);

  const saveCurrentScheduleAsTemplate = useCallback(() => {
    if (!scheduleTitle.trim() || schedule.length === 0) {
      toast({
        title: "Cannot save schedule",
        description: "Please provide a title and add timers to your schedule.",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: ScheduledTimerTemplate = {
      id: crypto.randomUUID(),
      title: scheduleTitle,
      schedule: schedule,
      commenceTime: commenceTime,
      commenceDay: commenceDay,
      scheduleStartOption: scheduleStartOption,
      isRecurring: isRecurring,
      recurrenceFrequency: recurrenceFrequency,
      timerColors: timerColors, // NEW: Save current timer colors with the template
    };

    setSavedSchedules((prev) => [...prev, newTemplate]);
    toast({
      title: "Schedule Saved!",
      description: `"${scheduleTitle}" has been saved as a template.`,
    });
  }, [scheduleTitle, schedule, commenceTime, commenceDay, scheduleStartOption, isRecurring, recurrenceFrequency, timerColors]);

  const loadScheduleTemplate = useCallback((templateId: string) => {
    const templateToLoad = savedSchedules.find(template => template.id === templateId);
    if (templateToLoad) {
      setSchedule(templateToLoad.schedule);
      setScheduleTitle(templateToLoad.title);
      setCommenceTime(templateToLoad.commenceTime);
      setCommenceDay(templateToLoad.commenceDay);
      setScheduleStartOption(templateToLoad.scheduleStartOption);
      setIsRecurring(templateToLoad.isRecurring);
      setRecurrenceFrequency(templateToLoad.recurrenceFrequency);
      setIsSchedulePrepared(true); // Loading a template means it's prepared
      setIsScheduleActive(false); // Not active until commenced
      setIsSchedulePending(templateToLoad.scheduleStartOption === 'custom_time'); // Set pending if custom_time
      setIsRunning(false);
      setIsPaused(true); // Paused, waiting for start/countdown
      setTimerColors(templateToLoad.timerColors || {}); // NEW: Load timer colors from the template
      
      // Also set the active schedule and colors when loading a template
      setActiveSchedule(templateToLoad.schedule);
      setActiveTimerColors(templateToLoad.timerColors || {});

      toast({
        title: "Schedule Loaded!",
        description: `"${templateToLoad.title}" has been loaded.`,
      });
    }
  }, [savedSchedules]);

  const deleteScheduleTemplate = useCallback((templateId: string) => {
    setSavedSchedules((prev) => prev.filter(template => template.id !== templateId));
    toast({
      title: "Schedule Deleted!",
      description: "The schedule template has been removed.",
    });
  }, []);

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
      if (shouldPlayEndSound) playSound(); // Play sound only if enabled

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
        if (nextIndex < activeSchedule.length) { // Use activeSchedule here
          setCurrentScheduleIndex(nextIndex);
          setTimerType(activeSchedule[nextIndex].type); // Use activeSchedule here
          setTimeLeft(activeSchedule[nextIndex].durationMinutes * 60); // Use activeSchedule here
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          // Schedule completed
          if (shouldShowEndToast) { // Show toast only if enabled
            toast({
              title: "Schedule Completed!",
              description: `"${scheduleTitle}" has finished.`,
            });
          }
          
          // Calculate final accumulated times before saving
          const finalFocusSeconds = accumulatedFocusSeconds + (timerType === 'focus' && currentPhaseStartTime !== null ? (Date.now() - currentPhaseStartTime) / 1000 : 0);
          const finalBreakSeconds = accumulatedBreakSeconds + (timerType === 'break' && currentPhaseStartTime !== null ? (Date.now() - currentPhaseStartTime) / 1000 : 0);
          const totalSession = finalFocusSeconds + finalBreakSeconds;

          // Call saveSession from ProfileContext here
          saveSession(
            seshTitle,
            notes,
            finalFocusSeconds,
            finalBreakSeconds,
            totalSession,
            activeJoinedSessionCoworkerCount,
            sessionStartTime || Date.now() // Use sessionStartTime or current time if null
          );

          resetSchedule(); // Reset all timer states after saving
        }
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, isFlashing, playSound, isScheduleActive, activeSchedule, currentScheduleIndex, timerType, resetSchedule, scheduleTitle, currentPhaseStartTime, setAccumulatedFocusSeconds, setAccumulatedBreakSeconds, shouldPlayEndSound, shouldShowEndToast, saveSession, seshTitle, notes, accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount, sessionStartTime]);

  // Initial time setting when focus/break minutes change
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isSchedulePending && !isSchedulePrepared) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isSchedulePending, isSchedulePrepared]);

  // Active Asks functions
  const addAsk = useCallback((ask: ActiveAskItem) => {
    setActiveAsks((prev) => [...prev, ask]);
  }, []);

  const updateAsk = useCallback((updatedAsk: ActiveAskItem) => {
    setActiveAsks((prev) =>
      prev.map((ask) => (ask.id === updatedAsk.id ? updatedAsk : ask))
    );
  }, []);

  // Load TimerContext states from local storage on initial mount
  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_TIMER);
    if (storedData) {
      const data = JSON.parse(storedData);
      setFocusMinutes(data.focusMinutes ?? 25);
      setBreakMinutes(data.breakMinutes ?? 5);
      setSeshTitle(data.seshTitle ?? "Notes");
      setNotes(data.notes ?? "");
      setShowSessionsWhileActive(data.showSessionsWhileActive ?? false);
      setIsGlobalPrivate(data.isGlobalPrivate ?? false);
      setTimerType(data.timerType ?? 'focus');
      setTimeLeft(data.timeLeft ?? (data.timerType === 'focus' ? data.focusMinutes * 60 : data.breakMinutes * 60));
      setIsRunning(data.isRunning ?? false);
      setIsPaused(data.isPaused ?? false);
      setIsFlashing(data.isFlashing ?? false);
      setSchedule(data.schedule ?? []);
      setCurrentScheduleIndex(data.currentScheduleIndex ?? 0);
      setIsSchedulingMode(data.isSchedulingMode ?? false);
      setIsScheduleActive(data.isScheduleActive ?? false);
      setIsSchedulePrepared(data.isSchedulePrepared ?? false); // NEW
      setScheduleTitle(data.scheduleTitle ?? "My Focus Sesh");
      setCommenceTime(data.commenceTime ?? ""); // Changed default to empty string
      setCommenceDay(data.commenceDay ?? null);
      setIsRecurring(data.isRecurring ?? false);
      setRecurrenceFrequency(data.recurrenceFrequency ?? 'daily');
      setSessionStartTime(data.sessionStartTime ?? null);
      setCurrentPhaseStartTime(data.currentPhaseStartTime ?? null);
      setAccumulatedFocusSeconds(data.accumulatedFocusSeconds ?? 0);
      setAccumulatedBreakSeconds(data.accumulatedBreakSeconds ?? 0);
      setActiveJoinedSessionCoworkerCount(data.activeJoinedSessionCoworkerCount ?? 0);
      setActiveAsks(data.activeAsks ?? []);
      setIsSchedulePending(data.isSchedulePending ?? false);
      setScheduleStartOption(data.scheduleStartOption ?? 'now');
      setShouldPlayEndSound(data.shouldPlayEndSound ?? false); // Changed default to false
      setShouldShowEndToast(data.shouldShowEndToast ?? false); // Changed default to false
      setIsBatchNotificationsEnabled(data.isBatchNotificationsEnabled ?? false);
      setBatchNotificationPreference(data.batchNotificationPreference ?? 'break');
      setCustomBatchMinutes(data.customBatchMinutes ?? timerIncrement);
      setLock(data.lock ?? false);
      setExemptionsEnabled(data.exemptionsEnabled ?? false);
      setPhoneCalls(data.phoneCalls ?? false);
      setFavourites(data.favourites ?? false);
      setWorkApps(data.workApps ?? false);
      setIntentionalBreaches(data.intentionalBreaches ?? false);
      setManualTransition(data.manualTransition ?? false);
      setMaxDistance(data.maxDistance ?? 1000);
      setAskNotifications(data.askNotifications ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setSessionInvites(data.sessionInvites ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setFriendActivity(data.friendActivity ?? { push: false, vibrate: false, sound: false }); // Changed default to false
      setBreakNotificationsVibrate(data.breakNotificationsVibrate ?? false); // Changed default to false
      setVerificationStandard(data.verificationStandard ?? 'anyone');
      setProfileVisibility(data.profileVisibility ?? ['public']); // Updated default to array
      setLocationSharing(data.locationSharing ?? false);
      setOpenSettingsAccordions(data.openSettingsAccordions ?? []);
      setTimerColors(data.timerColors ?? {}); // NEW: Load timer colors
      setActiveSchedule(data.activeSchedule ?? []); // NEW: Load active schedule
      setActiveTimerColors(data.activeTimerColors ?? {}); // NEW: Load active timer colors

      // Load savedSchedules, merging with defaults if local storage is empty for schedules
      const loadedSchedules = data.savedSchedules ?? [];
      setSavedSchedules(loadedSchedules.length > 0 ? loadedSchedules : DEFAULT_SCHEDULE_TEMPLATES);
    } else {
      // If no data in local storage, initialize with default templates
      setSavedSchedules(DEFAULT_SCHEDULE_TEMPLATES);
    }
  }, []);

  // Save TimerContext states to local storage whenever they change
  useEffect(() => {
    const dataToSave = {
      focusMinutes, breakMinutes, isRunning, isPaused, timeLeft, timerType, isFlashing,
      notes, seshTitle, showSessionsWhileActive, schedule, currentScheduleIndex,
      isSchedulingMode, isScheduleActive, isSchedulePrepared, scheduleTitle, commenceTime, commenceDay, // NEW
      isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime, // NEW: timerColors
      currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
      shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
      customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
      intentionalBreaches, manualTransition, maxDistance, askNotifications, sessionInvites,
      friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
      locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, // NEW: Save active schedule and colors
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_TIMER, JSON.stringify(dataToSave));
  }, [
    focusMinutes, breakMinutes, isRunning, isPaused, timeLeft, timerType, isFlashing,
    notes, seshTitle, showSessionsWhileActive, schedule, currentScheduleIndex,
    isSchedulingMode, isScheduleActive, isSchedulePrepared, scheduleTitle, commenceTime, commenceDay, // NEW
    isGlobalPrivate, isRecurring, recurrenceFrequency, savedSchedules, timerColors, sessionStartTime, // NEW: timerColors
    currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, activeAsks, isSchedulePending, scheduleStartOption,
    shouldPlayEndSound, shouldShowEndToast, isBatchNotificationsEnabled, batchNotificationPreference,
    customBatchMinutes, lock, exemptionsEnabled, phoneCalls, favourites, workApps,
    intentionalBreaches, manualTransition, maxDistance, askNotifications, sessionInvites,
    friendActivity, breakNotificationsVibrate, verificationStandard, profileVisibility,
    locationSharing, openSettingsAccordions, activeSchedule, activeTimerColors, // NEW: Save active schedule and colors
  ]);

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
    setTimerIncrement: () => {}, // Placeholder, as timerIncrement is currently a constant

    schedule,
    setSchedule,
    currentScheduleIndex,
    setCurrentScheduleIndex,
    isSchedulingMode,
    setIsSchedulingMode,
    isScheduleActive,
    setIsScheduleActive,
    isSchedulePrepared, // NEW
    setIsSchedulePrepared, // NEW
    startSchedule,
    commencePreparedSchedule, // NEW
    resetSchedule,
    scheduleTitle,
    setScheduleTitle,
    commenceTime,
    setCommenceTime,
    commenceDay,
    setCommenceDay,
    isGlobalPrivate,
    setIsGlobalPrivate,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,

    activeSchedule, // NEW
    setActiveSchedule, // NEW
    activeTimerColors, // NEW
    setActiveTimerColors, // NEW

    savedSchedules,
    saveCurrentScheduleAsTemplate,
    loadScheduleTemplate,
    deleteScheduleTemplate,

    timerColors, // NEW
    setTimerColors, // NEW

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
    // saveSessionToHistory, // REMOVED

    activeAsks,
    addAsk,
    updateAsk,

    isSchedulePending,
    setIsSchedulePending,
    scheduleStartOption,
    setScheduleStartOption,

    shouldPlayEndSound,
    setShouldPlayEndSound,
    shouldShowEndToast,
    setShouldShowEndToast,
    isBatchNotificationsEnabled,
    setIsBatchNotificationsEnabled,
    batchNotificationPreference,
    setBatchNotificationPreference,
    customBatchMinutes,
    setCustomBatchMinutes,
    lock,
    setLock,
    exemptionsEnabled,
    setExemptionsEnabled,
    phoneCalls,
    setPhoneCalls,
    favourites,
    setFavourites,
    workApps,
    setWorkApps,
    intentionalBreaches,
    setIntentionalBreaches,
    manualTransition,
    setManualTransition,
    maxDistance,
    setMaxDistance,
    askNotifications,
    setAskNotifications,
    sessionInvites,
    setSessionInvites,
    friendActivity,
    setFriendActivity,
    breakNotificationsVibrate,
    setBreakNotificationsVibrate,
    verificationStandard,
    setVerificationStandard,
    profileVisibility,
    setProfileVisibility,
    locationSharing,
    setLocationSharing,
    openSettingsAccordions,
    setOpenSettingsAccordions,
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