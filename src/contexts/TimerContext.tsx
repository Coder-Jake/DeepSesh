import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ScheduledTimer } from "@/types/timer"; // Import ScheduledTimer type

interface NotificationSettings {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
}

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
  isGlobalPublic: boolean;
  setIsGlobalPublic: React.Dispatch<React.SetStateAction<boolean>>;
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
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'flowsesh_settings';

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timerIncrement, setTimerIncrement] = useState(5);
  const [shouldPlayEndSound, setShouldPlayEndSound] = useState(true);
  const [shouldShowEndToast, setShouldShowEndToast] = useState(true);
  const [showSessionsWhileActive, setShowSessionsWhileActive] = useState(false);
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
  const [isGlobalPublic, setIsGlobalPublic] = useState(false);

  // Timer-related states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [timerType, setTimerType] = useState<'focus' | 'break'>('focus');
  const [isFlashing, setIsFlashing] = useState(false);
  const [notes, setNotes] = useState("");

  // Schedule-related states
  const [schedule, setSchedule] = useState<ScheduledTimer[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [isSchedulingMode, setIsSchedulingMode] = useState(false);
  const [isScheduleActive, setIsScheduleActive] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [commenceTime, setCommenceTime] = useState("09:00"); // Default value
  const [commenceDay, setCommenceDay] = useState(0); // Default to Sunday

  // Utility function for formatting time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    }
  };

  const resetSchedule = () => {
    setIsScheduleActive(false);
    setCurrentScheduleIndex(0);
    setSchedule([]);
    setScheduleTitle("");
    setIsRunning(false);
    setIsPaused(false);
    setIsFlashing(false);
    setTimerType('focus');
    setTimeLeft(focusMinutes * 60);
  };

  // Timer logic for schedule
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && !isPaused && isScheduleActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning && isScheduleActive) {
      // Current timer phase ended
      if (currentScheduleIndex < schedule.length - 1) {
        // Move to next item in schedule
        const nextIndex = currentScheduleIndex + 1;
        const nextItem = schedule[nextIndex];
        setCurrentScheduleIndex(nextIndex);
        setTimerType(nextItem.type);
        setTimeLeft(nextItem.durationMinutes * 60);
        // Optionally play a sound or show a toast for transition
      } else {
        // Schedule completed
        resetSchedule();
        // Optionally play a completion sound or show a final toast
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeLeft, isScheduleActive, currentScheduleIndex, schedule, setTimeLeft, setTimerType, setCurrentScheduleIndex]);


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
      setIsGlobalPublic(settings.isGlobalPublic ?? false);

      // Load timer/schedule specific states
      setIsRunning(settings.isRunning ?? false);
      setIsPaused(settings.isPaused ?? false);
      setTimeLeft(settings.timeLeft ?? focusMinutes * 60);
      setTimerType(settings.timerType ?? 'focus');
      setIsFlashing(settings.isFlashing ?? false);
      setNotes(settings.notes ?? "");
      setSchedule(settings.schedule ?? []);
      setCurrentScheduleIndex(settings.currentScheduleIndex ?? 0);
      setIsSchedulingMode(settings.isSchedulingMode ?? false);
      setIsScheduleActive(settings.isScheduleActive ?? false);
      setScheduleTitle(settings.scheduleTitle ?? "");
      setCommenceTime(settings.commenceTime ?? "09:00");
      setCommenceDay(settings.commenceDay ?? 0);
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
      isGlobalPublic,
      // Timer/Schedule specific states
      isRunning,
      isPaused,
      timeLeft,
      timerType,
      isFlashing,
      notes,
      schedule,
      currentScheduleIndex,
      isSchedulingMode,
      isScheduleActive,
      scheduleTitle,
      commenceTime,
      commenceDay,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [
    focusMinutes, breakMinutes, timerIncrement, shouldPlayEndSound, shouldShowEndToast,
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, maxDistance, askNotifications, sessionInvites, friendActivity,
    breakNotificationsVibrate, verificationStandard, profileVisibility, locationSharing,
    isGlobalPublic,
    // Timer/Schedule specific dependencies
    isRunning, isPaused, timeLeft, timerType, isFlashing, notes,
    schedule, currentScheduleIndex, isSchedulingMode, isScheduleActive,
    scheduleTitle, commenceTime, commenceDay,
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
    isGlobalPublic, setIsGlobalPublic,
    formatTime,
    // Timer-related states
    isRunning, setIsRunning,
    isPaused, setIsPaused,
    timeLeft, setTimeLeft,
    timerType, setTimerType,
    isFlashing, setIsFlashing,
    notes, setNotes,
    // Schedule-related states
    schedule, setSchedule,
    currentScheduleIndex, setCurrentScheduleIndex,
    isSchedulingMode, setIsSchedulingMode,
    isScheduleActive, setIsScheduleActive,
    startSchedule, resetSchedule,
    scheduleTitle, setScheduleTitle,
    commenceTime, setCommenceTime,
    commenceDay, setCommenceDay,
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