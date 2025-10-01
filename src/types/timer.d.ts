export interface ScheduledTimer {
  id: string;
  title: string;
  type: "focus" | "break";
  durationMinutes: number;
  isCustom: boolean;
  customTitle?: string;
}

// Define types for Ask items (copied from Index.tsx to ensure consistency)
export interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PollOption {
  id: string;
  text: string;
  votes: { userId: string }[];
}

export interface Poll {
  id: string;
  question: string;
  type: 'closed' | 'choice' | 'selection';
  creator: string;
  options: PollOption[];
  status: 'active' | 'closed';
  allowCustomResponses: boolean;
}

export type ActiveAskItem = ExtendSuggestion | Poll;

export interface NotificationSettings {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
}

export interface TimerContextType {
  // Scheduling states
  schedule: ScheduledTimer[];
  setSchedule: (schedule: ScheduledTimer[]) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (isScheduling: boolean) => void;
  startSchedule: () => void;
  resetSchedule: () => void; // Added resetSchedule
  scheduleTitle: string;
  setScheduleTitle: (title: string) => void;
  commenceTime: string;
  setCommenceTime: (time: string) => void;
  commenceDay: number;
  setCommenceDay: (day: number) => void;
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  setRecurrenceFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void;
  isScheduleActive: boolean;
  currentScheduleIndex: number;
  isSchedulePending: boolean;
  setIsSchedulePending: (isPending: boolean) => void;

  // Core Timer states
  focusMinutes: number;
  setFocusMinutes: (minutes: number) => void;
  breakMinutes: number;
  setBreakMinutes: (minutes: number) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  timerType: 'focus' | 'break';
  setTimerType: (type: 'focus' | 'break') => void;
  isFlashing: boolean;
  setIsFlashing: (flashing: boolean) => void;
  notes: string;
  setNotes: (notes: string) => void;
  seshTitle: string;
  setSeshTitle: (title: string) => void;
  formatTime: (seconds: number) => string;
  timerIncrement: number;
  setTimerIncrement: (increment: number) => void; // Added setTimerIncrement

  // Session management states
  showSessionsWhileActive: boolean;
  setShowSessionsWhileActive: (show: boolean) => void;
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

  // Ask/Poll states
  activeAsks: ActiveAskItem[];
  addAsk: (ask: ActiveAskItem) => void;
  updateAsk: (ask: ActiveAskItem) => void;

  // Settings states
  shouldPlayEndSound: boolean;
  setShouldPlayEndSound: (play: boolean) => void;
  shouldShowEndToast: boolean;
  setShouldShowEndToast: (show: boolean) => void;
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
  setManualTransition: (enabled: boolean) => void;
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
  verificationStandard: 'anyone' | 'phone1' | 'organisation' | 'id1';
  setVerificationStandard: (standard: 'anyone' | 'phone1' | 'organisation' | 'id1') => void;
  profileVisibility: 'public' | 'friends' | 'private';
  setProfileVisibility: (visibility: 'public' | 'friends' | 'private') => void;
  locationSharing: boolean;
  setLocationSharing: (sharing: boolean) => void;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: (isPrivate: boolean) => void;
  openSettingsAccordions: string[];
  setOpenSettingsAccordions: (accordions: string[]) => void;
}