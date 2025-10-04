export type ScheduledTimer = {
  id: string;
  title: string;
  type: 'focus' | 'break';
  durationMinutes: number;
  isCustom: boolean;
  customTitle?: string;
};

// ScheduledTimerTemplate moved to src/types/timer.ts

export type ActiveAskItem = {
  id: string;
  question: string;
  options: string[];
  responses: { userId: string; response: string }[];
  expiresAt: number;
};

export type NotificationSettings = {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
};

export type TimerContextType = {
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
  timerIncrement: number;
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>;

  schedule: ScheduledTimer[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  isSchedulingMode: boolean;
  setIsSchedulingMode: React.Dispatch<React.SetStateAction<boolean>>;
  startSchedule: () => void;
  resetSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null;
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'manual' | 'custom_time'>>;
  isRecurring: boolean;
  setIsRecurring: React.Dispatch<React.SetStateAction<boolean>>;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  setRecurrenceFrequency: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly'>>;
  isScheduleActive: boolean;
  currentScheduleIndex: number;
  isSchedulePending: boolean;
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>;
  isSchedulePrepared: boolean; // NEW
  setIsSchedulePrepared: React.Dispatch<React.SetStateAction<boolean>>; // NEW

  activeSchedule: ScheduledTimer[]; // NEW
  setActiveSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>; // NEW
  activeTimerColors: Record<string, string>; // NEW
  setActiveTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>; // NEW

  savedSchedules: ScheduledTimerTemplate[]; // NEW
  saveCurrentScheduleAsTemplate: () => void; // NEW
  loadScheduleTemplate: (templateId: string) => void; // NEW
  deleteScheduleTemplate: (templateId: string) => void; // NEW

  timerColors: Record<string, string>; // NEW
  setTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>; // NEW

  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: React.Dispatch<React.SetStateAction<boolean>>;
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
  // saveSessionToHistory: () => Promise<void>; // REMOVED

  activeAsks: ActiveAskItem[];
  addAsk: (ask: ActiveAskItem) => void;
  updateAsk: (updatedAsk: ActiveAskItem) => void;

  shouldPlayEndSound: boolean;
  setShouldPlayEndSound: React.Dispatch<React.SetStateAction<boolean>>;
  shouldShowEndToast: boolean;
  setShouldShowEndToast: React.Dispatch<React.SetStateAction<boolean>>;
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
  verificationStandard: 'anyone' | 'phone1' | 'organisation' | 'id1';
  setVerificationStandard: React.Dispatch<React.SetStateAction<'anyone' | 'phone1' | 'organisation' | 'id1'>>;
  profileVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setProfileVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  locationSharing: boolean;
  setLocationSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  openSettingsAccordions: string[];
  setOpenSettingsAccordions: React.Dispatch<React.SetStateAction<string[]>>;
};