import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScheduledTimer } from "@/types/timer";
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface NotificationSettings {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
}

type TimePeriod = 'week' | 'month' | 'all';

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
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  formatTime: (seconds: number) => string;

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

  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardFocusTimePeriod: TimePeriod;
  setLeaderboardFocusTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardCollaborationTimePeriod: TimePeriod;
  setLeaderboardCollaborationTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;

  localSessions: Tables<'sessions'>[]; // New state for local sessions
  setLocalSessions: React.Dispatch<React.SetStateAction<Tables<'sessions'>[]>>; // Setter for local sessions

  saveSessionToHistory: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'flowsesh_settings';

// Define initial sample sessions outside the component
const initialSampleSessions: Tables<'sessions'>[] = [
  {
    id: "sample-session-1",
    title: "Deep Work Sprint",
    created_at: new Date("2025-09-15T10:00:00Z").toISOString(),
    focus_duration_seconds: 45 * 60,
    break_duration_seconds: 0,
    total_session_seconds: 45 * 60,
    coworker_count: 3,
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    session_start_time: new Date("2025-09-15T09:15:00Z").toISOString(),
    session_end_time: new Date("2025-09-15T10:00:00Z").toISOString(),
    user_id: null,
  },
  {
    id: "sample-session-2",
    title: "Study Group Alpha",
    created_at: new Date("2025-09-14T14:00:00Z").toISOString(),
    focus_duration_seconds: 90 * 60,
    break_duration_seconds: 15 * 60,
    total_session_seconds: 105 * 60,
    coworker_count: 5,
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
    session_start_time: new Date("2025-09-14T12:15:00Z").toISOString(),
    session_end_time: new Date("2025-09-14T14:00:00Z").toISOString(),
    user_id: null,
  },
  {
    id: "sample-session-3",
    title: "Solo Focus",
    created_at: new Date("2025-09-13T08:30:00Z").toISOString(),
    focus_duration_seconds: 30 * 60,
    break_duration_seconds: 0,
    total_session_seconds: 30 * 60,
    coworker_count: 1,
    notes: "Quick focused session to review quarterly goals and plan next steps.",
    session_start_time: new Date("2025-09-13T08:00:00Z").toISOString(),
    session_end_time: new Date("2025-09-13T08:30:00Z").toISOString(),
    user_id: null,
  },
  {
    id: "sample-session-4",
    title: "Coding Session",
    created_at: new Date("2025-09-12T11:00:00Z").toISOString(),
    focus_duration_seconds: 120 * 60,
    break_duration_seconds: 20 * 60,
    total_session_seconds: 140 * 60,
    coworker_count: 2,
    notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
    session_start_time: new Date("2025-09-12T08:40:00Z").toISOString(),
    session_end_time: new Date("2025-09-12T11:00:00Z").toISOString(),
    user_id: null,
  },
  {
    id: "sample-session-5",
    title: "Research Deep Dive",
    created_at: new Date("2025-09-11T16:00:00Z").toISOString(),
    focus_duration_seconds: 60 * 60,
    break_duration_seconds: 10 * 60,
    total_session_seconds: 70 * 60,
    coworker_count: 4,
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
    session_start_time: new Date("2025-09-11T14:50:00Z").toISOString(),
    session_end_time: new Date("2025-09-11T16:00:00Z").toISOString(),
    user_id: null,
  },
];

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
  const [manualTransition, setManualTransition] = useState(false);
  const [maxDistance, setMaxDistance] = useState(2000);
  const [askNotifications, setAskNotifications] = useState<NotificationSettings>({ push: true, vibrate: false, sound: false });
  const [sessionInvites, setSessionInvites] = useState<NotificationSettings>({ push: true, vibrate: true, sound: true });
  const [friendActivity, setFriendActivity] = useState<NotificationSettings>({ push: true, vibrate: false, sound: false });
  const [breakNotificationsVibrate, setBreakNotificationsVibrate] = useState(false);
  const [verificationStandard, setVerificationStandard] = useState("anyone");
  const [profileVisibility, setProfileVisibility] = useState("friends");
  const [locationSharing, setLocationSharing] = useState("approximate");
  const [isGlobalPrivate, setIsGlobalPrivate] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");
  const [seshTitle, setSeshTitle] = useState("Notes");

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentPhaseStartTime, setCurrentPhaseStartTime] = useState<number | null>(null);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState(0);
  const [activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount] = useState(0);

  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [commenceTime, setCommenceTime] = useState("09:00");
  const [commenceDay, setCommenceDay] = useState(0);

  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod] = useState<TimePeriod>('week');

  const [localSessions, setLocalSessions] = useState<Tables<'sessions'>[]>([]); // New state for local sessions

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetAllTimerStates = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
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

  const saveSessionToHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (sessionStartTime === null) {
      toast.error("Failed to save session", {
        description: "Session start time was not recorded.",
      });
      return;
    }

    let finalAccumulatedFocusSeconds = accumulatedFocusSeconds;
    let finalAccumulatedBreakSeconds = accumulatedBreakSeconds;

    if (isRunning && currentPhaseStartTime !== null) {
      const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
      if (timerType === 'focus') {
        finalAccumulatedFocusSeconds += elapsed;
      } else {
        finalAccumulatedBreakSeconds += elapsed;
      }
      setCurrentPhaseStartTime(null); // Ensure current phase time is accounted for
    }

    const totalSessionSeconds = finalAccumulatedFocusSeconds + finalAccumulatedBreakSeconds;

    if (totalSessionSeconds <= 0) {
      toast.info("Session too short", {
        description: "Session was too short to be saved.",
      });
      resetAllTimerStates();
      return;
    }

    const sessionData: TablesInsert<'sessions'> = {
      user_id: userId,
      title: seshTitle,
      notes: notes,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: new Date(sessionStartTime).toISOString(),
      session_end_time: new Date().toISOString(),
    };

    // Add to local sessions
    setLocalSessions(prev => [...prev, sessionData]);

    // Attempt to save to Supabase if user is logged in
    if (userId) {
      const { error } = await supabase.from('sessions').insert(sessionData);

      if (error) {
        console.error("Error saving session to Supabase:", error);
        toast.error("Failed to save session to cloud", {
          description: error.message,
        });
      } else {
        toast.success("Session saved!", {
          description: `Your session "${seshTitle}" has been added to your history.`,
        });
      }
    } else {
      toast.success("Anonymous session saved!", {
        description: `Your session "${seshTitle}" has been saved locally. Log in to sync it to your history.`,
      });
    }
    resetAllTimerStates();
  };

  const startSchedule = () => {
    if (schedule.length > 0) {
      setIsScheduleActive(true);
      setCurrentScheduleIndex(0);
      setTimerType(schedule[0].type);
      setTimeLeft(schedule[0].durationMinutes * 60);
      setIsRunning(true);
      setIsPaused(false);
      setIsSchedulingMode(false);
      setSessionStartTime(Date.now());
      setCurrentPhaseStartTime(Date.now());
      setAccumulatedFocusSeconds(0);
      setAccumulatedBreakSeconds(0);
    }
  };

  const resetSchedule = () => {
    resetAllTimerStates();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && !isPaused && timeLeft > 0) {
      if (currentPhaseStartTime === null) {
        setCurrentPhaseStartTime(Date.now());
      }
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      if (currentPhaseStartTime !== null) {
        const elapsed = (Date.now() - currentPhaseStartTime) / 1000;
        if (timerType === 'focus') {
          setAccumulatedFocusSeconds(prev => prev + elapsed);
        } else {
          setAccumulatedBreakSeconds(prev => prev + elapsed);
        }
        setCurrentPhaseStartTime(null);
      }

      setIsRunning(false);

      if (isScheduleActive) {
        if (currentScheduleIndex < schedule.length - 1) {
          const nextIndex = currentScheduleIndex + 1;
          const nextItem = schedule[nextIndex];
          setCurrentScheduleIndex(nextIndex);
          setTimerType(nextItem.type);
          setTimeLeft(nextItem.durationMinutes * 60);
          setIsRunning(true);
          setIsFlashing(false);
          setCurrentPhaseStartTime(Date.now());
        } else {
          saveSessionToHistory();
        }
      } else if (!manualTransition) {
        const nextType = timerType === 'focus' ? 'break' : 'focus';
        setTimerType(nextType);
        setTimeLeft(nextType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
        setIsRunning(true);
        setIsFlashing(false);
        setCurrentPhaseStartTime(Date.now());
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
    accumulatedFocusSeconds, accumulatedBreakSeconds, saveSessionToHistory
  ]);

  useEffect(() => {
    if (!isRunning && !isPaused && !isScheduleActive && !isFlashing) {
      setTimeLeft(timerType === 'focus' ? focusMinutes * 60 : breakMinutes * 60);
    }
  }, [focusMinutes, breakMinutes, timerType, isRunning, isPaused, isScheduleActive, isFlashing, setTimeLeft]);

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
      setIntentionalBreaches(settings.intentionalBreaks ?? false); // Corrected typo
      setManualTransition(settings.manualTransition ?? false);
      setMaxDistance(settings.maxDistance ?? 2000);
      setAskNotifications(settings.askNotifications ?? { push: true, vibrate: false, sound: false });
      setSessionInvites(settings.sessionInvites ?? { push: true, vibrate: true, sound: true });
      setFriendActivity(settings.friendActivity ?? { push: true, vibrate: false, sound: false });
      setBreakNotificationsVibrate(settings.breakNotificationsVibrate ?? false);
      setVerificationStandard(settings.verificationStandard ?? "anyone");
      setProfileVisibility(settings.profileVisibility ?? "friends");
      setLocationSharing(settings.locationSharing ?? "approximate");
      setIsGlobalPrivate(settings.isGlobalPrivate ?? false);

      setIsRunning(settings.isRunning ?? false);
      setIsPaused(settings.isPaused ?? false);
      const loadedTimerType = settings.timerType ?? 'focus';
      const loadedFocusMinutes = settings.focusMinutes ?? 25;
      const loadedBreakMinutes = settings.breakMinutes ?? 5;
      setTimeLeft(settings.timeLeft ?? (loadedTimerType === 'focus' ? loadedFocusMinutes * 60 : loadedBreakMinutes * 60));
      setTimerType(loadedTimerType);
      setIsFlashing(settings.isFlashing ?? false);
      setNotes(settings.notes ?? "");
      setSeshTitle(settings.seshTitle ?? "Notes");
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

      setHistoryTimePeriod(settings.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(settings.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(settings.leaderboardCollaborationTimePeriod ?? 'week');
      
      setLocalSessions(settings.localSessions ?? initialSampleSessions); // Load local sessions, or initialize with samples
    } else {
      setLocalSessions(initialSampleSessions); // Initialize with sample data if no settings exist
    }
  }, []);

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
      isGlobalPrivate,
      isRunning,
      isPaused,
      timeLeft,
      timerType,
      isFlashing,
      notes,
      seshTitle,
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
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
      localSessions, // Save local sessions
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [
    focusMinutes, breakMinutes, timerIncrement, shouldPlayEndSound, shouldShowEndToast,
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, maxDistance, askNotifications, sessionInvites, friendActivity,
    breakNotificationsVibrate, verificationStandard, profileVisibility, locationSharing,
    isGlobalPrivate,
    isRunning, isPaused, timeLeft, timerType, isFlashing, notes, seshTitle,
    sessionStartTime, currentPhaseStartTime, accumulatedFocusSeconds, accumulatedBreakSeconds, activeJoinedSessionCoworkerCount,
    schedule, currentScheduleIndex, isSchedulingMode, isScheduleActive,
    scheduleTitle, commenceTime, commenceDay,
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
    localSessions, // Add localSessions as a dependency
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
    isGlobalPrivate, setIsGlobalPrivate,
    formatTime,
    isRunning, setIsRunning,
    isPaused, setIsPaused,
    timeLeft, setTimeLeft,
    timerType, setTimerType,
    isFlashing, setIsFlashing,
    notes, setNotes,
    seshTitle, setSeshTitle,
    sessionStartTime, setSessionStartTime,
    currentPhaseStartTime, setCurrentPhaseStartTime,
    accumulatedFocusSeconds, setAccumulatedFocusSeconds,
    accumulatedBreakSeconds, setAccumulatedBreakSeconds,
    activeJoinedSessionCoworkerCount, setActiveJoinedSessionCoworkerCount,
    schedule, setSchedule,
    currentScheduleIndex, setCurrentScheduleIndex,
    isSchedulingMode, setIsSchedulingMode,
    isScheduleActive, setIsScheduleActive,
    startSchedule, resetSchedule,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
    historyTimePeriod, setHistoryTimePeriod,
    leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod,
    leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod,
    localSessions, setLocalSessions, // Provide local sessions
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