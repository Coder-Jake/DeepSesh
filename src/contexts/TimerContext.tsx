import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScheduledTimer } from "@/types/timer"; // Import ScheduledTimer type
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
import { TablesInsert, Tables } from '@/integrations/supabase/types'; // Import Supabase types
import { toast } from 'sonner'; // Using sonner for notifications

interface NotificationSettings {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
}

type TimePeriod = 'week' | 'month' | 'all'; // Define TimePeriod type

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: React.Dispatch<React.SetStateAction<number>>;
  breakMinutes: number;
  setBreakMinutes: React.Dispatch<React.SetStateAction<number>>;
  timerIncrement: number;
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>;
  shouldPlayEndSound: boolean;
  setShouldPlayEndSound: React.Dispatch<React.SetStateAction<boolean>>;
  shouldShowEndToast: boolean;
  setShouldShowEndToast: React.Dispatch<React.SetStateAction<boolean>>;
  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: React.Dispatch<React.SetStateAction<boolean>>;
  isBatchNotificationsEnabled: boolean;
  setIsBatchNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  batchNotificationPreference: 'break' | 'sesh_end' | 'custom';
  setBatchNotificationPreference: React.Dispatch<React.SetStateAction<'break' | 'sesh_end' | 'custom'>>;
  customBatchMinutes: number;
  setCustomBatchMinutes: React.Dispatch<React.SetStateAction<number>>;
  lock: boolean;
  setLock: React.Dispatch<React.SetStateAction<boolean>>;
  exemptionsEnabled: boolean;
  setExemptionsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  phoneCalls: boolean;
  setPhoneCalls: React.Dispatch<React.SetStateAction<boolean>>;
  favourites: boolean;
  setFavourites: React.Dispatch<React.SetStateAction<boolean>>;
  workApps: boolean;
  setWorkApps: React.Dispatch<React.SetStateAction<boolean>>;
  intentionalBreaches: boolean;
  setIntentionalBreaches: React.Dispatch<React.SetStateAction<boolean>>;
  manualTransition: boolean;
  setManualTransition: React.Dispatch<React.SetStateAction<boolean>>;
  maxDistance: number;
  setMaxDistance: React.Dispatch<React.SetStateAction<number>>;
  askNotifications: NotificationSettings;
  setAskNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  sessionInvites: NotificationSettings;
  setSessionInvites: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  friendActivity: NotificationSettings;
  setFriendActivity: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  breakNotificationsVibrate: boolean;
  setBreakNotificationsVibrate: React.Dispatch<React.SetStateAction<boolean>>;
  verificationStandard: string;
  setVerificationStandard: React.Dispatch<React.SetStateAction<string>>;
  profileVisibility: string;
  setProfileVisibility: React.Dispatch<React.SetStateAction<string>>;
  locationSharing: string;
  setLocationSharing: React.Dispatch<React.SetStateAction<string>>;
  isGlobalPrivate: boolean; // Renamed from isGlobalPublic
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>; // Renamed from setIsGlobalPublic
  formatTime: (seconds: number) => string;

  // New timer-related states
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
  seshTitle: string; // Added seshTitle
  setSeshTitle: React.Dispatch<React.SetStateAction<string>>; // Added setSeshTitle

  // New session tracking states
  sessionStartTime: number | null;
  setSessionStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  currentPhaseStartTime: number | null;
  setCurrentPhaseStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  accumulatedFocusSeconds: number;
  setAccumulatedFocusSeconds: React.Dispatch<React.SetStateAction<number>>;
  accumulatedBreakSeconds: number;
  setAccumulatedBreakSeconds: React.Dispatch<React.SetStateAction<number>>;
  activeJoinedSessionCoworkerCount: number; // To store coworker count from joined session
  setActiveJoinedSessionCoworkerCount: React.Dispatch<React.SetStateAction<number>>;

  // New schedule-related states
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
  commenceDay: number;
  setCommenceDay: React.Dispatch<React.SetStateAction<number>>;

  // New persistent states for History and Leaderboard time filters
  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardFocusTimePeriod: TimePeriod;
  setLeaderboardFocusTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardCollaborationTimePeriod: TimePeriod;
  setLeaderboardCollaborationTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;

  // Local storage for anonymous sessions
  localAnonymousSessions: Tables<'sessions'>[];
  setLocalAnonymousSessions: React.Dispatch<React.SetStateAction<Tables<'sessions'>[]>>;

  // Function to save session
  saveSessionToHistory: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'flowsesh_settings';

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timerIncrement, setTimerIncrement] = useState(5);
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(true);
  const [shouldShowEndToast, setShouldShowEndToast] = useState(true);
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(true);
  const [isBatchNotificationsEnabled, setIsBatchNotificationsEnabled] = useState(false);
  const [batchNotificationPreference, setBatchNotificationPreference] = useState<'break' | 'sesh_end' | 'custom'>('break');
  const [customBatchMinutes, setCustomBatchMinutes] = useState(15);
  const [lock, setLock] = useState(false);
  const [exemptionsEnabled, setExemptionsEnabled] = useState(false);
  const [phoneCalls, setPhoneCalls] = useState(false);
  const [favourites, setFavourites] = useState(false);
  const [workApps, setWorkApps] = useState(false);
  const [intentionalBreaches, setIntentionalBreaches] = useState(false);
  const [manualTransition, setManualTransition] = useState(false); // Default to false
  const [maxDistance, setMaxDistance] = useState(2000);
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: true, vibrate: false, sound: false });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: true, vibrate: false, sound: false });
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(false);
  const [verificationStandard, setVerificationStandard] = useState("anyone");
  const [profileVisibility, setProfileVisibility] = useState("friends");
  const [locationSharing, setLocationSharing] = useState("approximate");
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false); // Renamed and default to false

  // Timer-related states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes"); // Default Sesh Title

  // Session tracking states
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  // Schedule-related states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [commenceTime, setCommenceTime] = useState("09:00"); // Default value
  const [commenceDay, setCommenceDay] = useState(0); // Default to Sunday

  // New persistent states for History and Leaderboard time filters
  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod] = useState<TimePeriod>('week');

  // Local storage for anonymous sessions
  const [localAnonymousSessions, setLocalAnonymousSessions] = useState<Tables<'sessions'>[]>([]);

  // Utility function for formatting time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to reset all timer-related states to defaults
  const resetAllTimerStates = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60); // Reset to default focus time
    setNotes("");
    setSeshTitle("Notes");
    setSessionStartTime(null);
    setCurrentPhaseStartTime(null);
    setAccumulatedFocusSeconds(0);
    setAccumulatedBreakSeconds(0);
    setActiveJoinedSessionCoworkerCount(0);
    setSchedule([]);
    setCurrentScheduleIndex(0);
    setIsSchedulingMode(false);
    setIsScheduleActive(false);
    setScheduleTitle("");
    setCommenceTime("09:00");
    setCommenceDay(0);
  };

  // Function to save session to Supabase or local storage
  const saveSessionToHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null; // Get user ID if logged in, otherwise null

    if (sessionStartTime === null) {
      toast.error("Failed to save session", {
        description: "Session start time was not recorded.",
      });
      return;
    }

    // Ensure current phase time is added before saving
    let finalAccumulatedFocusSeconds = accumulatedFocusSeconds;
    let finalAccumulatedBreakSeconds = accumulatedBreakSeconds;

    if (isRunning && currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        finalAccumulatedFocusSeconds += elapsed;
      } else {
        finalAccumulatedBreakSeconds += elapsed;
      }
    }

    const totalSessionSeconds = finalAccumulatedFocusSeconds + finalAccumulatedBreakSeconds;

    if (totalSessionSeconds <= 0) {
      toast.info("Session too short", {
        description: "Session was too short to be saved.",
      });
      return;
    }

    const sessionData: TablesInsert<'sessions'> = {
      user_id: userId, // Use userId (can be null)
      title: seshTitle,
      notes: notes,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: new Date(sessionStartTime).toISOString(),
      session_end_time: new Date().toISOString(),
    };

    if (userId) {
      const { error } = await supabase.from('sessions').insert(sessionData);

      if (error) {
        console.error("Error saving session to Supabase:", error);
        toast.error("Failed to save session", {
          description: error.message,
        });
      } else {
        toast.success("Session saved!", {
          description: `Your session "${seshTitle}" has been added to your history.`,
        });
      }
    } else {
      // Save to local storage for anonymous users
      const newLocalSession: Tables<'sessions'> = { 
        ...sessionData, 
        id: crypto.randomUUID(), // Assign a local ID
        created_at: new Date().toISOString(), // Ensure created_at is set for local sessions
        user_id: null, // Explicitly null for anonymous
      };
      setLocalAnonymousSessions(prev => [...prev, newLocalSession]);
      toast.success("Anonymous session saved!", {
        description: `Your session "${seshTitle}" has been saved locally.`,
      });
    }
    resetAllTimerStates(); // Reset all states after saving
  };

  // Schedule functions
  const startSchedule = () => {
    if (schedule.length > 0) {
      setIsScheduleActive(true);
      setCurrentScheduleIndex(0);
      setTimerType(schedule[0].type);
      setTimeLeft(schedule[0].durationMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setIsSchedulingMode(false); // Exit scheduling mode once started
      setSessionStartTime(Date.now()); // Start overall session timer
      setCurrentPhaseStartTime(Date.now()); // Start current phase timer
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
    }
  };

  const resetSchedule = () => {
    resetAllTimerStates(); // Use the comprehensive reset function
  };

  // Core Timer Countdown Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && !isPaused && timeLeft > 0) {
      if (currentPhaseStartTime === null) { // If resuming from pause or starting new phase
        setCurrentPhaseStartTime(Date.now());
      }
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Phase ended, accumulate time
      if (currentPhaseStartTime !== null) {
        const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
        if (timerType === 'focus') {
          setAccumulatedFocusSeconds(prev => prev + elapsed);
        } else {
          setAccumulatedBreakSeconds(prev => prev + elapsed);
        }
        setCurrentPhaseStartTime(null); // Reset phase start time
      }

      setIsRunning(false); // Stop the timer

      if (isScheduleActive) {
        if (currentScheduleIndex < schedule.length - 1) {
          const nextIndex = currentScheduleIndex + 1;
          const nextItem = schedule[nextIndex];
          setCurrentScheduleIndex(nextIndex);
          setTimerType(nextItem.type);
          setTimeLeft(nextItem.durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now()); // Start new phase timer
        } else {
          saveSessionToHistory(); // Schedule completed, save session
        }
      } else if (!manualTransition) {
        const nextType = timerType === 'focus' ? 'break' : 'focus';
        setTimerType(nextType);
        setTimeLeft(nextType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
        setIsRunning(true);
        setIsFlashing(false);
        setCurrentPhaseStartTime(Date.now()); // Start new phase timer
      } else {
        setIsFlashing(true);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning, isPaused, timeLeft, isScheduleActive, currentScheduleIndex, schedule,
    setTimeLeft, setTimerType, setCurrentScheduleIndex, setIsRunning, setIsFlashing,
    focusMinutes, breakMinutes, manualTransition, currentPhaseStartTime,
    accumulatedFocusSeconds, accumulatedBreakSeconds, saveSessionToHistory, timerType // Added timerType
  ]);

  // Effect to update timeLeft when focusMinutes or breakMinutes change (if timer is not active)
  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isFlashing) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isFlashing, setTimeLeft]);


  // Load settings from local storage on initial mount
  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setFocusMinutes(settings.focusMinutes ?? 25);
      setBreakMinutes(settings.breakMinutes ?? 5);
      setTimerIncrement(settings.timerIncrement ?? 5);
      setShouldPlayEndSound(settings.shouldPlayEndSound ?? true);
      setShouldShowEndToast(settings.shouldShowEndToast ?? true);
      setShowSessionsWhileActive(settings.showSessionsWhileActive ?? true);
      setIsBatchNotificationsEnabled(settings.isBatchNotificationsEnabled ?? false);
      setBatchNotificationPreference(settings.batchNotificationPreference ?? 'break');
      setCustomBatchMinutes(settings.customBatchMinutes ?? 15);
      setLock(settings.lock ?? false);
      setExemptionsEnabled(settings.exemptionsEnabled ?? false);
      setPhoneCalls(settings.phoneCalls ?? false);
      setFavourites(settings.favourites ?? false);
      setWorkApps(settings.workApps ?? false);
      setIntentionalBreaches(settings.intentionalBreaches ?? false);
      setManualTransition(settings.manualTransition ?? false);
      setMaxDistance(settings.maxDistance ?? 2000);
      setAskNotifications(settings.askNotifications ?? { push: true, vibrate: false, sound: false });
      setSessionInvites(settings.sessionInvites ?? { push: true, vibrate: true, sound: true });
      setFriendActivity(settings.friendActivity ?? { push: true, vibrate: false, sound: false });
      setBreakNotificationsVibrate(settings.breakNotificationsVibrate ?? false);
      setVerificationStandard(settings.verificationStandard ?? "anyone");
      setProfileVisibility(settings.profileVisibility ?? "friends");
      setLocationSharing(settings.locationSharing ?? "approximate");
      setIsGlobalPrivate(settings.isGlobalPrivate ?? false); // Renamed and default to false

      // Load timer/schedule specific states
      setIsRunning(settings.isRunning ?? false);
      setIsPaused(settings.isPaused ?? false);
      // Ensure timeLeft is initialized correctly based on loaded timerType and minutes
      const loadedTimerType = settings.timerType ?? 'focus';
      const loadedFocusMinutes = settings.focusMinutes ?? 25;
      const loadedBreakMinutes = settings.breakMinutes ?? 5;
      setTimeLeft(settings.timeLeft ?? (loadedTimerType === 'focus' ? loadedFocusMinutes * 60 : loadedBreakMinutes * 60));
      setTimerType(loadedTimerType);
      setIsFlashing(settings.isFlashing ?? false);
      setNotes(settings.notes ?? "");
      setSeshTitle(settings.seshTitle ?? "Notes"); // Load seshTitle
      setSessionStartTime(settings.sessionStartTime ?? null);
      setCurrentPhaseStartTime(settings.currentPhaseStartTime ?? null);
      setAccumulatedFocusSeconds(settings.accumulatedFocusSeconds ?? 0);
      setAccumulatedBreakSeconds(settings.accumulatedBreakSeconds ?? 0);
      setActiveJoinedSessionCoworkerCount(settings.activeJoinedSessionCoworkerCount ?? 0);
      setSchedule(settings.schedule ?? []);
      setCurrentScheduleIndex(settings.currentScheduleIndex ?? 0);
      setIsSchedulingMode(settings.isSchedulingMode ?? false);
      setIsScheduleActive(settings.isScheduleActive ?? false);
      setScheduleTitle(settings.scheduleTitle ?? "");
      setCommenceTime(settings.commenceTime ?? "09:00");
      setCommenceDay(settings.commenceDay ?? 0);

      // Load new persistent states for History and Leaderboard time filters
      setHistoryTimePeriod(settings.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(settings.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(settings.leaderboardCollaborationTimePeriod ?? 'week');

      // Load local anonymous sessions
      setLocalAnonymousSessions(settings.localAnonymousSessions ?? []);
    }
  }, []);

  // Save settings to local storage whenever they change
  useEffect(() => {
    const settingsToSave = {
      focusMinutes,
      breakMinutes,
      timerIncrement,
      shouldPlayEndSound,
      shouldShowEndToast,
      showSessionsWhileActive,
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
      isGlobalPrivate, // Renamed
      // Timer/Schedule specific states
      isRunning,
      isPaused,
      timeLeft,
      timerType,
      isFlashing,
      notes,
      seshTitle, // Save seshTitle
      sessionStartTime,
      currentPhaseStartTime,
      accumulatedFocusSeconds,
      accumulatedBreakSeconds,
      activeJoinedSessionCoworkerCount,
      schedule,
      currentScheduleIndex,
      isSchedulingMode,
      isScheduleActive,
      scheduleTitle,
      commenceTime,
      commenceDay,
      // New persistent states for History and Leaderboard time filters
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
      // Local anonymous sessions
      localAnonymousSessions,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [
    focusMinutes, breakMinutes, timerIncrement, shouldPlayEndSound, shouldShowEndToast,
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, maxDistance, askNotifications, sessionInvites, friendActivity,
    breakNotificationsVibrate, verificationStandard, profileVisibility, locationSharing,
    isGlobalPrivate, // Renamed
    // Timer/Schedule specific dependencies
    isRunning, isPaused, timeLeft, timerType, isFlashing, notes, seshTitle, // Added seshTitle
    sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount,
    schedule, currentScheduleIndex, isSchedulingMode, isScheduleActive,
    scheduleTitle, commenceTime, commenceDay,
    // New persistent states for History and Leaderboard time filters
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
    // Local anonymous sessions
    localAnonymousSessions,
  ]);

  const value = {
    focusMinutes, setFocusMinutes,
    breakMinutes, setBreakMinutes,
    timerIncrement, setTimerIncrement,
    shouldPlayEndSound, setShouldPlayEndSound,
    shouldShowEndToast, setShouldShowEndToast,
    showSessionsWhileActive, setShowSessionsWhileActive,
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
    isGlobalPrivate, setIsGlobalPrivate, // Renamed
    formatTime,
    // Timer-related states
    isRunning, setIsRunning,
    isPaused, setIsPaused,
    timeLeft, setTimeLeft,
    timerType, setTimerType,
    isFlashing, setIsFlashing,
    notes, setNotes,
    seshTitle, setSeshTitle, // Added seshTitle
    // Session tracking states
    sessionStartTime, setSessionStartTime,
    currentPhaseStartTime, setCurrentPhaseStartTime,
    accumulatedFocusSeconds, setAccumulatedFocusSeconds,
    accumulatedBreakSeconds, setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount,
    // Schedule-related states
    schedule, setSchedule,
    currentScheduleIndex, setCurrentScheduleIndex,
    isSchedulingMode, setIsSchedulingMode,
    isScheduleActive, setIsScheduleActive,
    startSchedule, resetSchedule,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
    // New persistent states for History and Leaderboard time filters
    historyTimePeriod, setHistoryTimePeriod,
    leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod,
    leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod,
    // Local anonymous sessions
    localAnonymousSessions, setLocalAnonymousSessions,
    // Function to save session
    saveSessionToHistory,
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