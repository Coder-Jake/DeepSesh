import React from 'react'; // Import React for React.Dispatch

export interface ScheduledTimer {
  id: string;
  title: string;
  type: 'focus' | 'break';
  // Removed isCustom: boolean;
  // Removed customTitle?: string;
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
  timerColors: Record<string, string>; // NEW: Store colors for timers within this template
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
  commenceSpecificPreparedSchedule: (templateId: string) => void; // NEW: Added this line
  discardPreparedSchedule: (templateId: string) => void; // NEW: Added this line
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
  setIsScheduleActive: React.Dispatch<React.SetStateAction<boolean>>; // Added this line
  currentScheduleIndex: number;
  isSchedulePending: boolean; // Added new state
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>; // Added new setter
  isSchedulePrepared: boolean; // NEW: Indicates a schedule is set for later, but not actively running
  setIsSchedulePrepared: React.Dispatch<React.SetStateAction<boolean>>; // NEW

  // Snapshot of the schedule when it's active or prepared
  activeSchedule: ScheduledTimer[]; // NEW
  setActiveSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>; // NEW
  activeTimerColors: Record<string, string>; // NEW
  setActiveTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>; // NEW
  activeScheduleDisplayTitle: string; // NEW: Title for the active/prepared schedule timeline
  setActiveScheduleDisplayTitle: React.Dispatch<React.SetStateAction<string>>; // NEW: Setter for activeScheduleDisplayTitle

  // Saved Schedules (Templates)
  savedSchedules: ScheduledTimerTemplate[]; // Added
  saveCurrentScheduleAsTemplate: () => void; // Added
  loadScheduleTemplate: (templateId: string) => void; // Added
  deleteScheduleTemplate: (templateId: string) => void; // Added

  // Prepared Schedules (Upcoming)
  preparedSchedules: ScheduledTimerTemplate[]; // NEW
  setPreparedSchedules: React.Dispatch<React.SetStateAction<ScheduledTimerTemplate[]>>; // NEW

  // Timer Colors
  timerColors: Record<string, string>; // NEW
  setTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>; // NEW

  // Core Timer states (homepage current values)
  focusMinutes: number; // Current focus minutes on homepage
  setHomepageFocusMinutes: React.Dispatch<React.SetStateAction<number>>; // Setter for homepage focus minutes
  breakMinutes: number; // Current break minutes on homepage
  setHomepageBreakMinutes: React.Dispatch<React.SetStateAction<number>>; // Setter for homepage break minutes
  
  // Default Timer states (settings values)
  defaultFocusMinutes: number; // Default focus minutes from settings
  setDefaultFocusMinutes: React.Dispatch<React.SetStateAction<number>>; // Setter for default focus minutes
  defaultBreakMinutes: number; // Default break minutes from settings
  setDefaultBreakMinutes: React.Dispatch<React.SetStateAction<number>>; // Setter for default break minutes

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
  isSeshTitleCustomized: boolean; // NEW: Added customization flag
  formatTime: (seconds: number) => string;
  timerIncrement: number;
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>; // Changed to number

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

  // NEW: Host/Coworker role states
  currentSessionRole: 'host' | 'coworker' | null;
  setCurrentSessionRole: React.Dispatch<React.SetStateAction<'host' | 'coworker' | null>>;
  currentSessionHostName: string | null;
  setCurrentSessionHostName: React.Dispatch<React.SetStateAction<string | null>>;
  currentSessionOtherParticipants: { id: string; name: string; sociability?: number; intention?: string; bio?: string }[];
  setCurrentSessionOtherParticipants: React.Dispatch<React.SetStateAction<{ id: string; name: string; sociability?: number; intention?: string; bio?: string }[]>>;
  allParticipantsToDisplay: string[]; // NEW: Added allParticipantsToDisplay

  // Schedule pending state (only for the *active* schedule if it's custom_time and waiting)
  isSchedulePending: boolean;
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'manual' | 'custom_time'>>;

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
  profileVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setProfileVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  locationSharing: boolean;
  setLocationSharing: React.Dispatch<React.SetStateAction<boolean>>;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  openSettingsAccordions: string[];
  setOpenSettingsAccordions: React.Dispatch<React.SetStateAction<string[]>>;
  is24HourFormat: boolean; // NEW
  setIs24HourFormat: React.Dispatch<React.SetStateAction<boolean>>; // NEW
  areToastsEnabled: boolean; // NEW
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>; // NEW
}