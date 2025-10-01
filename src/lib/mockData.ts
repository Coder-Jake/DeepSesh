import { Tables } from "@/integrations/supabase/types";

// Mock Profiles for participants and session creators
export const mockProfiles: Tables<'profiles'>[] = [
  { id: "mock-user-1", first_name: "Alex", last_name: "Smith", avatar_url: null, bio: "Student focusing on math.", intention: "Reviewing differential equations.", sociability: 90, updated_at: new Date().toISOString() },
  { id: "mock-user-2", first_name: "Sam", last_name: "Jones", avatar_url: null, bio: "Enjoys coding challenges.", intention: "Working on problem set 3.", sociability: 80, updated_at: new Date().toISOString() },
  { id: "mock-user-3", first_name: "Taylor", last_name: "Brown", avatar_url: null, bio: "Preparing for exams.", intention: "Preparing for the midterm exam.", sociability: 90, updated_at: new Date().toISOString() },
  { id: "mock-user-4", first_name: "Morgan", last_name: "Davis", avatar_url: null, bio: "Python enthusiast.", intention: "Debugging a Python script.", sociability: 20, updated_at: new Date().toISOString() },
  { id: "mock-user-5", first_name: "Jordan", last_name: "Miller", avatar_url: null, bio: "Technical writer.", intention: "Writing documentation for API.", sociability: 10, updated_at: new Date().toISOString() },
  { id: "mock-user-6", first_name: "Casey", last_name: "Wilson", avatar_url: null, bio: "Always learning new tech.", intention: "Learning new framework.", sociability: 20, updated_at: new Date().toISOString() },
  { id: "mock-user-7", first_name: "Riley", last_name: "Moore", avatar_url: null, bio: "Loves clean code.", intention: "Code refactoring.", sociability: 20, updated_at: new Date().toISOString() },
  { id: "mock-user-8", first_name: "Avery", last_name: "Taylor", avatar_url: null, bio: "Database architect.", intention: "Designing database schema.", sociability: 30, updated_at: new Date().toISOString() },
  { id: "mock-user-9", first_name: "Jamie", last_name: "Anderson", avatar_url: null, bio: "Psychology major.", intention: "Reviewing cognitive psychology.", sociability: 60, updated_at: new Date().toISOString() },
  { id: "mock-user-10", first_name: "Quinn", last_name: "Thomas", avatar_url: null, bio: "Memory techniques expert.", intention: "Memorizing key terms.", sociability: 60, updated_at: new Date().toISOString() },
  { id: "mock-user-11", first_name: "Blake", last_name: "Jackson", avatar_url: null, bio: "Essay writing pro.", intention: "Practicing essay questions.", sociability: 70, updated_at: new Date().toISOString() },
  { id: "mock-user-12", first_name: "Drew", last_name: "White", avatar_url: null, bio: "Research paper enthusiast.", intention: "Summarizing research papers.", sociability: 60, updated_at: new Date().toISOString() },
  { id: "mock-user-13", first_name: "Chris", last_name: "Harris", avatar_url: null, bio: "Flashcard creator.", intention: "Creating flashcards.", sociability: 50, updated_at: new Date().toISOString() },
  { id: "mock-user-14", first_name: "Pat", last_name: "Martin", avatar_url: null, bio: "Discussion leader.", intention: "Discussing theories.", sociability: 55, updated_at: new Date().toISOString() },
  { id: "mock-user-15", first_name: "Jess", last_name: "Thompson", avatar_url: null, bio: "Loves peer teaching.", intention: "Peer teaching.", sociability: 70, updated_at: new Date().toISOString() },
];

// Helper to convert mock session data to Tables<'sessions'> format
const convertToSupabaseSession = (session: any): Tables<'sessions'> => {
  const now = Date.now();
  const sessionStartTime = new Date(now - (session.totalDurationMinutes * 60 * 1000)).toISOString();
  const sessionEndTime = new Date(now).toISOString();

  return {
    id: session.id.toString(), // Convert number ID to string
    user_id: session.participants[0]?.id ? `mock-user-${session.participants[0].id}` : null, // Map numeric ID to mock-user-ID string
    title: session.title,
    notes: session.workspaceDescription,
    focus_duration_seconds: session.type === 'focus' ? session.currentPhaseDurationMinutes * 60 : 0,
    break_duration_seconds: session.type === 'break' ? session.currentPhaseDurationMinutes * 60 : 0,
    total_session_seconds: session.totalDurationMinutes * 60,
    coworker_count: session.participants.length,
    session_start_time: sessionStartTime,
    session_end_time: sessionEndTime,
    created_at: new Date().toISOString(),
  };
};

// Original mock data structure with numeric participant IDs
export interface DemoSession {
  id: number;
  title: string;
  type: 'focus' | 'break';
  totalDurationMinutes: number;
  currentPhase: 'focus' | 'break';
  currentPhaseDurationMinutes: number;
  startTime: number;
  location: string;
  workspaceImage: string;
  workspaceDescription: string;
  participants: { id: number; name: string; sociability: number; intention?: string; bio?: string }[];
}

export const mockNearbySessions: DemoSession[] = [
  {
    id: 101,
    title: "Advanced Calculus Study Group",
    type: "focus",
    totalDurationMinutes: 90,
    currentPhase: "focus",
    currentPhaseDurationMinutes: 75,
    startTime: Date.now() - (5.52 * 60 * 1000),
    location: "Engineering Library - Room 304",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Quiet study space with whiteboards",
    participants: [
      { id: 1, name: "Alex", sociability: 90, intention: "Reviewing differential equations." },
      { id: 2, name: "Sam", sociability: 80, intention: "Working on problem set 3." },
      { id: 3, name: "Taylor", sociability: 90, intention: "Preparing for the midterm exam." },
    ],
  },
  {
    id: 102,
    title: "Computer Science Lab",
    type: "focus",
    totalDurationMinutes: 120,
    currentPhase: "focus",
    currentPhaseDurationMinutes: 100,
    startTime: Date.now() - (76.8 * 60 * 1000),
    location: "Science Building - Computer Lab 2B",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Modern lab with dual monitors",
    participants: [
      { id: 4, name: "Morgan", sociability: 20, intention: "Debugging a Python script." },
      { id: 5, name: "Jordan", sociability: 10, intention: "Writing documentation for API." },
      { id: 6, name: "Casey", sociability: 20, intention: "Learning new framework." },
      { id: 7, name: "Riley", sociability: 20, intention: "Code refactoring." },
      { id: 8, name: "Avery", sociability: 30, intention: "Designing database schema." },
    ],
  },
];

export const mockFriendsSessions: DemoSession[] = [
  {
    id: 201,
    title: "Psychology 101 Final Review",
    type: "focus",
    totalDurationMinutes: 90,
    currentPhase: "break",
    currentPhaseDurationMinutes: 15,
    startTime: Date.now() - (10.66 * 60 * 1000),
    location: "Main Library - Study Room 12",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Private group study room",
    participants: [
      { id: 9, name: "Jamie", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: 10, name: "Quinn", sociability: 60, intention: "Memorizing key terms." },
      { id: 11, name: "Blake", sociability: 70, intention: "Practicing essay questions." },
      { id: 12, name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: 13, name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: 14, name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: 3, name: "Taylor", sociability: 65, intention: "Collaborating on study guide." }, // Re-using Taylor
      { id: 15, name: "Jess", sociability: 70, intention: "Peer teaching." },
    ],
  },
];

export const mockSessionsForHistoryAndLeaderboard: Tables<'sessions'>[] = [
  ...mockNearbySessions.map(convertToSupabaseSession),
  ...mockFriendsSessions.map(convertToSupabaseSession),
];