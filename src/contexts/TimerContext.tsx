import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationSettings {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
}

interface TimerContextType {
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  timerIncrement: number;
  setTimerIncrement: (increment: number) => void;
  shouldPlayEndSound: boolean;
  setShouldPlayEndSound: (shouldPlay: boolean) => void;
  shouldShowEndToast: boolean;
  setShouldShowEndToast: (shouldShow: boolean) => void;
  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: (show: boolean) => void;
  isBatchNotificationsEnabled: boolean;
  setIsBatchNotificationsEnabled: (enabled: boolean) => void;
  batchNotificationPreference: 'break' | 'sesh_end' | 'custom';
  setBatchNotificationPreference: (preference: 'break' | 'sesh_end' | 'custom') => void;
  customBatchMinutes: number;
  setCustomBatchMinutes: (minutes: number) => void;
  lock: boolean;
  setLock: (locked: boolean) => void;
  exemptionsEnabled: boolean;
  setExemptionsEnabled: (enabled: boolean) => void;
  phoneCalls: boolean;
  setPhoneCalls: (enabled: boolean) => void;
  favourites: boolean;
  setFavourites: (enabled: boolean) => void;
  workApps: boolean;
  setWorkApps: (enabled: boolean) => void;
  intentionalBreaches: boolean;
  setIntentionalBreaches: (enabled: boolean) => void;
  manualTransition: boolean;
  setManualTransition: (manual: boolean) => void;
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
  askNotifications: NotificationSettings;
  setAskNotifications: (settings: NotificationSettings) => void;
  sessionInvites: NotificationSettings;
  setSessionInvites: (settings: NotificationSettings) => void;
  friendActivity: NotificationSettings;
  setFriendActivity: (settings: NotificationSettings) => void;
  breakNotificationsVibrate: boolean;
  setBreakNotificationsVibrate: (vibrate: boolean) => void;
  verificationStandard: string;
  setVerificationStandard: (standard: string) => void;
  profileVisibility: string;
  setProfileVisibility: (visibility: string) => void;
  locationSharing: string;
  setLocationSharing: (sharing: string) => void;
  isGlobalPublic: boolean;
  setIsGlobalPublic: (isPublic: boolean) => void;
  formatTime: (seconds: number) => string; // Added formatTime to context type
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

  // Utility function for formatting time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [
    focusMinutes, breakMinutes, timerIncrement, shouldPlayEndSound, shouldShowEndToast,
    showSessionsWhileActive, isBatchNotificationsEnabled, batchNotificationPreference, customBatchMinutes,
    lock, exemptionsEnabled, phoneCalls, favourites, workApps, intentionalBreaches,
    manualTransition, maxDistance, askNotifications, sessionInvites, friendActivity,
    breakNotificationsVibrate, verificationStandard, profileVisibility, locationSharing,
    isGlobalPublic,
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
    formatTime, // Provided formatTime
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