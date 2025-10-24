import { DAYS_OF_WEEK } from "@/lib/constants";

// Define the structure for a single timer item within a schedule
export type ScheduledTimer = {
  id: string;
  title: string;
  type: 'focus' | 'break';
  durationMinutes: number;
  isCustom?: boolean;
  customTitle?: string;
};

// Define the structure for a scheduled timer template
export interface ScheduledTimerTemplate {
  id: string;
  title: string;
  schedule: ScheduledTimer[];
  commenceTime: string; // e.g., "09:00"
  commenceDay: number | null; // null for "Today (default)" or specific day index (0-6)
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  isRecurring: boolean;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  timerColors: Record<string, string>;
}

// Define the structure for an active schedule item (what's currently running)
export interface ActiveScheduleItem extends ScheduledTimer {
  // Add any runtime-specific properties here if needed, e.g., actualStartTime
}

// Define the structure for an active schedule (what's currently running)
export interface ActiveSchedule {
  id: string;
  title: string;
  schedule: ActiveScheduleItem[];
  commenceTime: string;
  commenceDay: number | null;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  isRecurring: boolean;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  timerColors: Record<string, string>;
}

// Define types for ExtendSuggestion (an "Ask" item)
export interface ExtendSuggestion {
  id: string;
  minutes: number;
  creator: string;
  votes: { userId: string; vote: 'yes' | 'no' | 'neutral' }[];
  status: 'pending' | 'accepted' | 'rejected';
}

// Define types for Poll (another "Ask" item)
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

// Union type for all possible active "Ask" items
export type ActiveAskItem = ExtendSuggestion | Poll;

// Type for poll types
export type PollType = 'closed' | 'choice' | 'selection';

// Define the structure for notification settings
export type NotificationSettings = {
  push: boolean;
  vibrate: boolean;
  sound: boolean;
};

// Define the structure for the TimerContext value
export type TimerContextType = {
  focusMinutes: number;
  setHomepageFocusMinutes: React.Dispatch<React.SetStateAction<number>>;
  breakMinutes: number;
  setHomepageBreakMinutes: React.Dispatch<React.SetStateAction<number>>;
  defaultFocusMinutes: number;
  setDefaultFocusMinutes: React.Dispatch<React.SetStateAction<number>>;
  defaultBreakMinutes: number;
  setDefaultBreakMinutes: React.Dispatch<React.SetStateAction<number>>;
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
  isSeshTitleCustomized: boolean;
  formatTime: (seconds: number) => string;
  timerIncrement: number;
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>;

  schedule: ScheduledTimer[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  currentScheduleIndex: number;
  setCurrentScheduleIndex: React.Dispatch<React.SetStateAction<number>>;
  isSchedulingMode: boolean;
  setIsSchedulingMode: React.Dispatch<React.SetStateAction<boolean>>;
  isScheduleActive: boolean;
  setIsScheduleActive: React.Dispatch<React.SetStateAction<boolean>>;
  isSchedulePrepared: boolean;
  setIsSchedulePrepared: React.Dispatch<React.SetStateAction<boolean>>;
  startSchedule: () => void;
  commenceSpecificPreparedSchedule: (templateId: string) => void;
  discardPreparedSchedule: (templateId: string) => void;
  resetSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null;
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>;
  isGlobalPrivate: boolean;
  setIsGlobalPrivate: React.Dispatch<React.SetStateAction<boolean>>;
  isRecurring: boolean;
  setIsRecurring: React.Dispatch<React.SetStateAction<boolean>>;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  setRecurrenceFrequency: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly'>>;
  scheduleStartOption: 'now' | 'manual' | 'custom_time';
  setScheduleStartOption: React.Dispatch<React.SetStateAction<'now' | 'manual' | 'custom_time'>>;

  activeSchedule: ScheduledTimer[];
  setActiveSchedule: React.Dispatch<React.SetStateAction<ScheduledTimer[]>>;
  activeTimerColors: Record<string, string>;
  setActiveTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeScheduleDisplayTitle: string;
  setActiveScheduleDisplayTitle: React.Dispatch<React.SetStateAction<string>>;

  savedSchedules: ScheduledTimerTemplate[];
  saveCurrentScheduleAsTemplate: () => void;
  loadScheduleTemplate: (templateId: string) => void;
  deleteScheduleTemplate: (templateId: string) => void;

  preparedSchedules: ScheduledTimerTemplate[];
  setPreparedSchedules: React.Dispatch<React.SetStateAction<ScheduledTimerTemplate[]>>;

  timerColors: Record<string, string>;
  setTimerColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

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

  activeAsks: ActiveAskItem[];
  addAsk: (ask: ActiveAskItem) => void;
  updateAsk: (updatedAsk: ActiveAskItem) => void;
  setActiveAsks: React.Dispatch<React.SetStateAction<ActiveAskItem[]>>;

  currentSessionRole: 'host' | 'coworker' | null;
  setCurrentSessionRole: React.Dispatch<React.SetStateAction<'host' | 'coworker' | null>>;
  currentSessionHostName: string | null;
  setCurrentSessionHostName: React.Dispatch<React.SetStateAction<string | null>>;
  currentSessionOtherParticipants: { id: string; name: string; sociability?: number; intention?: string; bio?: string }[];
  setCurrentSessionOtherParticipants: React.Dispatch<React.SetStateAction<{ id: string; name: string; sociability?: number; intention?: string; bio?: string }[]>>;
  allParticipantsToDisplay: string[];

  isSchedulePending: boolean;
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>; // NEW: Added setIsSchedulePending
  isTimeLeftManagedBySession: boolean; // NEW: Added isTimeLeftManagedBySession
  setIsTimeLeftManagedBySession: React.Dispatch<React.SetStateAction<boolean>>; // NEW: Added setIsTimeLeftManagedBySession

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
  joinNotifications: NotificationSettings;
  setJoinNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
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
  openSettingsAccordions: string[];
  setOpenSettingsAccordions: React.Dispatch<React.SetStateAction<string[]>>;
  is24HourFormat: boolean;
  setIs24HourFormat: React.Dispatch<React.SetStateAction<boolean>>;
  areToastsEnabled: boolean;
  setAreToastsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  startStopNotifications: NotificationSettings;
  setStartStopNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  playSound: () => void;
  triggerVibration: () => void;
  showSessionsWhileActive: boolean; // NEW: Added showSessionsWhileActive
  setShowSessionsWhileActive: React.Dispatch<React.SetStateAction<boolean>>; // NEW: Added setShowSessionsWhileActive
};

// Define the structure for a saved session
export interface SavedSession {
  id: string;
  title: string;
  notes: string;
  focusDurationSeconds: number;
  breakDurationSeconds: number;
  totalDurationSeconds: number;
  coworkerCount: number;
  startTime: number; // Timestamp of when the session started
  endTime: number; // Timestamp of when the session ended
  asks: ActiveAskItem[]; // Store the state of asks at the end of the session
  participants: Array<{ id: string; name: string; sociability: number; role: 'host' | 'coworker'; intention?: string; bio?: string }>; // Store participants
}