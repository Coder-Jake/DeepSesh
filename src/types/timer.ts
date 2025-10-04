import React from 'react'; // Import React for React.Dispatch

export interface ScheduledTimer {
  id: string;
  title: string;
  type: 'focus' | 'break';
  durationMinutes: number;
  isCustom: boolean;
  customTitle?: string;
}

export interface ScheduledTimerTemplate {
  id: string;
  title: string;
  schedule: ScheduledTimer[];
  commenceTime: string;
  commenceDay: number | null; // Changed to allow null for dynamic 'today'
  scheduleStartOption: 'now' | 'manual' | 'custom_time'; // Added 'manual'
  isRecurring: boolean;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
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
  setSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  isSchedulingMode: boolean;
  setIsSchedulingMode: React.Dispatch<React.SetStateAction<boolean>>;
  startSchedule: () => void;
  resetSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null; // Updated to allow null
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>; // Updated to allow null
  scheduleStartOption: 'now' | 'manual' | 'custom_time'; // Added 'manual'
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'manual' | 'custom_time'>>; // Added
  isRecurring: boolean; // Added
  setIsRecurring: React.Dispatch<React.SetStateAction<boolean>>; // Added
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly'; // Added
  setRecurrenceFrequency: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly'>>; // Added
  isScheduleActive: boolean;
  currentScheduleIndex: number;
  isSchedulePending: boolean; // Added new state
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>; // Added new setter
  isSchedulePrepared: boolean; // NEW: Indicates a schedule is set for later, but not actively running
  setIsSchedulePrepared: React.Dispatch<React.SetStateAction<boolean>>; // NEW

  // Saved Schedules (Templates)
  savedSchedules: ScheduledTimerTemplate[]; // Added
  saveCurrentScheduleAsTemplate: () => void; // Added
  loadScheduleTemplate: (templateId: string) => void; // Added
  deleteScheduleTemplate: (templateId: string) => void; // Added

  // Core Timer states
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
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>; // Added

  // Session management states
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

  // Ask/Poll states
  activeAsks: ActiveAskItem[];
  addAsk: (ask: ActiveAskItem) => void;
  updateAsk: (ask: ActiveAskItem) => void;

  // Settings states
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
  profileVisibility: ('public' | 'friends' | 'organisation' | 'private')[]; // Updated to array
  setProfileVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>; // Updated to array
  locationSharing: boolean;
  setLocationSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  openSettingsAccordions: string[];
  setOpenSettingsAccordions: React.Dispatch<React.SetStateAction<string[]>>;
}