import { DAYS_OF_WEEK } from "@/contexts/TimerContext"; // Ensure this import is correct if DAYS_OF_WEEK is used here

// Define the structure for a single timer item within a schedule
export interface TimerItem {
  id: string;
  type: 'focus' | 'break';
  durationMinutes: number;
  notes: string;
  isGlobalPrivate: boolean;
  title: string;
}

// Define the structure for a scheduled timer template
export interface ScheduledTimerTemplate {
  id: string;
  title: string;
  items: TimerItem[];
  commenceTime: string; // e.g., "09:00"
  commenceDay: DAYS_OF_WEEK | null; // null for "every day" or specific day
  scheduleStartOption: 'manual' | 'custom_time'; // 'manual' means it's ready to start, 'custom_time' means it's scheduled
  isGlobalPrivate: boolean;
  createdAt: number; // Timestamp of creation
  lastModified: number; // Timestamp of last modification
}

// Define the structure for an active schedule (what's currently running)
// This might be slightly different from the template as it includes runtime state
export interface ActiveScheduleItem extends TimerItem {
  // Add any runtime-specific properties here if needed, e.g., actualStartTime
}

export interface ActiveSchedule {
  id: string;
  title: string;
  items: ActiveScheduleItem[];
  commenceTime: string; // The original commence time from the template
  commenceDay: DAYS_OF_WEEK | null; // The original commence day from the template
  scheduleStartOption: 'manual' | 'custom_time';
  isGlobalPrivate: boolean;
  // Add any other properties relevant to an active schedule, e.g., when it actually started
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
export type PollType = 'closed' | 'choice' | 'selection';

// NEW: Define the structure for a saved session
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