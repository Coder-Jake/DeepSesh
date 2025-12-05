import { DAYS_OF_WEEK } from "@/lib/constants";
import { Profile } from "@/contexts/ProfileContext";

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

// Define the structure for notification settings
export type NotificationSettings = {
  push: boolean;
};

// NEW: Define ParticipantSessionData for tracking participants in Supabase
export interface ParticipantSessionData {
  userId: string;
  userName: string;
  joinTime: number; // Unix timestamp
  role: 'host' | 'coworker';
  focusPreference?: number;
  intention?: string | null; // MODIFIED: Allow null
  bio?: string | null; // MODIFIED: Allow null
}

// NEW: Canonical DemoSession interface
export interface DemoSession {
  id: string;
  title: string;
  startTime: number;
  location: string;
  workspaceImage: string;
  workspaceDescription: string;
  participants: ParticipantSessionData[];
  location_lat?: number | null;
  location_long?: number | null;
  distance?: number | null;
  visibility: 'public' | 'friends' | 'organisation' | 'private';
  fullSchedule: ScheduledTimer[];
  user_id?: string | null;
  join_code?: string | null;
  organisation?: string[] | null; // MODIFIED: Changed to string[] | null
  host_notes?: string | null;
  is_mock?: boolean; // NEW: Added is_mock property
}

// NEW: Define a type for Supabase fetched sessions
export interface SupabaseSessionData {
  id: string;
  session_title: string;
  created_at: string;
  location_long: number | null;
  location_lat: number | null;
  focus_duration: number;
  break_duration: number;
  user_id: string | null;
  host_name: string;
  current_phase_type: 'focus' | 'break';
  current_phase_end_time: string;
  total_session_duration_seconds: number;
  schedule_id: string | null;
  schedule_data: ScheduledTimer[];
  // Removed 'is_active: boolean;' as the column no longer exists
  current_schedule_index: number;
  visibility: 'public' | 'friends' | 'organisation' | 'private';
  participants_data: ParticipantSessionData[];
  join_code: string | null;
  organisation: string[] | null; // MODIFIED: Changed to string[] | null
  host_notes: string | null;
  is_mock: boolean; // NEW: Added is_mock property
}

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
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  timerType: 'focus' | 'break';
  setTimerType: React.Dispatch<React.SetStateAction<'focus' | 'break'>>;
  isFlashing: boolean;
  setIsFlashing: React.Dispatch<React.SetStateAction<boolean>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  hostNotes: string;
  setHostNotes: React.Dispatch<React.SetStateAction<string>>;
  seshTitle: string;
  setSeshTitle: React.Dispatch<React.SetStateAction<string>>;
  isSeshTitleCustomized: boolean;
  formatTime: (seconds: number) => string;
  timerIncrement: number;
  setTimerIncrement: React.Dispatch<React.SetStateAction<number>>;
  getDefaultSeshTitle: () => string;

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
  commenceSpecificPreparedSchedule: (templateId: string, simulatedStartTime?: number | null, simulatedCurrentPhaseIndex?: number, simulatedTimeLeftInPhase?: number | null) => Promise<boolean>;
  discardPreparedSchedule: (templateId: string) => void;
  resetSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>;
  commenceTime: string;
  setCommenceTime: React.Dispatch<React.SetStateAction<string>>;
  commenceDay: number | null;
  setCommenceDay: React.Dispatch<React.SetStateAction<number | null>>;
  sessionVisibility: 'public' | 'private' | 'organisation';
  setSessionVisibility: React.Dispatch<React.SetStateAction<'public' | 'private' | 'organisation'>>;
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

  currentSessionRole: 'host' | 'coworker' | null;
  setCurrentSessionRole: React.Dispatch<React.SetStateAction<'host' | 'coworker' | null>>;
  currentSessionHostName: string | null;
  setCurrentSessionHostName: React.Dispatch<React.SetStateAction<string | null>>;
  currentSessionOtherParticipants: ParticipantSessionData[];
  setCurrentSessionOtherParticipants: React.Dispatch<React.SetStateAction<ParticipantSessionData[]>>;
  currentSessionParticipantsData: ParticipantSessionData[];
  setCurrentSessionParticipantsData: React.Dispatch<React.SetStateAction<ParticipantSessionData[]>>;
  allParticipantsToDisplay: string[];

  isSchedulePending: boolean;
  setIsSchedulePending: React.Dispatch<React.SetStateAction<boolean>>;
  isTimeLeftManagedBySession: boolean;
  setIsTimeLeftManagedBySession: React.Dispatch<React.SetStateAction<boolean>>;

  shouldShowEndToast: boolean; // NEW
  setShouldShowEndToast: React.Dispatch<React.SetStateAction<boolean>>; // NEW
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
  verificationStandard: 'anyone' | 'phone1' | 'organisation' | 'id1';
  setVerificationStandard: React.Dispatch<React.SetStateAction<'anyone' | 'phone1' | 'organisation' | 'id1'>>;
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
  showSessionsWhileActive: 'hidden' | 'nearby' | 'friends' | 'all';
  setShowSessionsWhileActive: React.Dispatch<React.SetStateAction<'hidden' | 'nearby' | 'friends' | 'all'>>;
  hasWonPrize: boolean;
  setHasWonPrize: React.Dispatch<React.SetStateAction<boolean>>;
  getLocation: () => Promise<{ latitude: number | null; longitude: number | null }>;
  geolocationPermissionStatus: PermissionState;
  isDiscoveryActivated: boolean;
  setIsDiscoveryActivated: React.Dispatch<React.SetStateAction<boolean>>;
  activeSessionRecordId: string | null;
  setActiveSessionRecordId: React.Dispatch<React.SetStateAction<string | null>>;
  joinSessionAsCoworker: (sessionToJoin: DemoSession, sessionTitle: string, hostName: string, participants: ParticipantSessionData[], fullSchedule: ScheduledTimer[], currentPhaseType: 'focus' | 'break', currentPhaseDurationMinutes: number, remainingSecondsInPhase: number) => Promise<boolean>;
  leaveSession: () => Promise<boolean>;
  transferHostRole: () => Promise<boolean>;
  stopTimer: (confirmPrompt: boolean, isLongPress: boolean) => Promise<void>;
  resetSessionStates: () => void;
  showDemoSessions: boolean;
  setShowDemoSessions: React.Dispatch<React.SetStateAction<boolean>>;
  currentPhaseDurationSeconds: number;
  setCurrentPhaseDurationSeconds: React.Dispatch<React.SetStateAction<number>>;
  remainingTimeAtPause: number;
  setRemainingTimeAtPause: React.Dispatch<React.SetStateAction<number>>;
  limitDiscoveryRadius: boolean;
  setLimitDiscoveryRadius: React.Dispatch<React.SetStateAction<boolean>>;
  selectedHostingOrganisation: string | null; // NEW: Add selectedHostingOrganisation
  setSelectedHostingOrganisation: React.Dispatch<React.SetStateAction<string | null>>; // NEW: Add setter
};

// Define the structure for a saved session
export interface SavedSession {
  id: string;
  title: string;
  notes: string;
  hostNotes: string;
  focusDurationSeconds: number;
  breakDurationSeconds: number;
  totalDurationSeconds: number;
  coworkerCount: number;
  startTime: number; // Timestamp of when the session started
  endTime: number; // Timestamp of when the session ended
  participants: Array<{ id: string; name: string; focusPreference: number; role: 'host' | 'coworker'; intention?: string | null; bio?: string | null }>; // MODIFIED: Allow null
}