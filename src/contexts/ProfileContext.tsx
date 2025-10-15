import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types"; // Import Json type
import { toast } from 'sonner'; // Using sonner for notifications
import { Poll, ActiveAskItem, ExtendSuggestion } from "@/types/timer"; // Import Poll, ActiveAskItem, ExtendSuggestion types

type Profile = Tables<'public', 'profiles'>;
type ProfileInsert = TablesInsert<'public', 'profiles'>;
type ProfileUpdate = TablesInsert<'public', 'profiles'>;

export type TimePeriod = 'week' | 'month' | 'all'; // Define TimePeriod type

// New types for session history and stats data
export interface SessionHistory {
  id: string; // Changed from number to string
  title: string;
  date: string;
  duration: string;
  participants: number;
  type: 'focus' | 'break';
  notes: string;
  asks?: ActiveAskItem[]; // Changed from polls?: Poll[] to asks?: ActiveAskItem[]
  session_start_time: string; // NEW: Added session_start_time
  session_end_time: string;   // NEW: Added session_end_time
}

export interface StatsPeriodData {
  totalFocusTime: string;
  sessionsCompleted: number;
  uniqueCoworkers: number;
  focusRank: string;
  coworkerRank: string;
}

export interface StatsData {
  week: StatsPeriodData;
  month: StatsPeriodData;
  all: StatsPeriodData;
}

// Helper function to format seconds into a duration string (e.g., "1h 30m" or "45 mins")
const formatSecondsToDurationString = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} mins`;
};

// Helper function to parse "XXh YYm" to total seconds
const parseDurationStringToSeconds = (durationString: string): number => {
  const matchHours = durationString.match(/(\d+)h/);
  if (matchHours) {
    return parseInt(matchHours[1], 10) * 3600;
  }
  const matchMinutes = durationString.match(/(\d+)m/);
  if (matchMinutes) {
    return parseInt(matchMinutes[1], 10) * 60;
  }
  return 0; // Default to 0 if format is unexpected
};

// Helper to check if a session date falls within the current week
const isDateInCurrentWeek = (sessionDate: Date, today: Date): boolean => {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Set to Sunday of current week
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Saturday of current week
  endOfWeek.setHours(23, 59, 59, 999);

  return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
};

// Helper to check if a session date falls within the current month
const isDateInCurrentMonth = (sessionDate: Date, today: Date): boolean => {
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
  endOfMonth.setHours(23, 59, 59, 999);

  return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
};


// Initial data for sessions (now includes asks property for consistency)
const initialSessions: SessionHistory[] = [
  {
    id: crypto.randomUUID(),
    title: "Deep Work Sprint",
    date: new Date("2225-09-15T09:00:00Z").toISOString(),
    duration: "45 mins",
    participants: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    asks: [], // Changed from polls: []
    session_start_time: new Date("2225-09-15T09:00:00Z").toISOString(),
    session_end_time: new Date("2225-09-15T09:45:00Z").toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Study Group Alpha",
    date: new Date("2225-09-14T10:30:00Z").toISOString(),
    duration: "90 mins",
    participants: 5,
    type: "focus",
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
    asks: [], // Changed from polls: []
    session_start_time: new Date("2225-09-14T10:30:00Z").toISOString(),
    session_end_time: new Date("2225-09-14T12:00:00Z").toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Solo Focus",
    date: new Date("2225-09-13T14:00:00Z").toISOString(),
    duration: "30 mins",
    participants: 1,
    type: "focus",
    notes: "Quick focused session to review quarterly goals and plan next steps.",
    asks: [], // Changed from polls: []
    session_start_time: new Date("2225-09-13T14:00:00Z").toISOString(),
    session_end_time: new Date("2225-09-13T14:30:00Z").toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Coding Session",
    date: new Date("2225-09-12T11:00:00Z").toISOString(),
    duration: "120 mins",
    participants: 2,
    type: "focus",
    notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
    asks: [], // Changed from polls: []
    session_start_time: new Date("2225-09-12T11:00:00Z").toISOString(),
    session_end_time: new Date("2225-09-12T13:00:00Z").toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Research Deep Dive",
    date: new Date("2225-09-11T16:00:00Z").toISOString(),
    duration: "60 mins",
    participants: 4,
    type: "focus",
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
    asks: [], // Changed from polls: []
    session_start_time: new Date("2225-09-11T16:00:00Z").toISOString(),
    session_end_time: new Date("2225-09-11T17:00:00Z").toISOString(),
  }
];

// Initial data for stats
const initialStatsData: StatsData = {
  week: {
    totalFocusTime: "22h 0m",
    sessionsCompleted: 5,
    uniqueCoworkers: 5,
    focusRank: "3rd",
    coworkerRank: "4th",
  },
  month: {
    totalFocusTime: "70h 0m",
    sessionsCompleted: 22,
    uniqueCoworkers: 18,
    focusRank: "5th",
    coworkerRank: "3rd",
  },
  all: {
    totalFocusTime: "380h 0m",
    sessionsCompleted: 80,
    uniqueCoworkers: 65,
    focusRank: "4th",
    coworkerRank: "5th",
  },
};

// Lists for random host code generation (moved from Profile.tsx)
const colors = [
  "red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "grey", "black", "white",
  "gold", "silver", "bronze", "indigo", "violet", "teal", "cyan", "magenta", "lime", "maroon",
  "navy", "olive", "aqua", "fuchsia", "azure", "beige", "coral", "crimson", "lavender", "plum"
];
const animals = [
  "fox", "bear", "cat", "dog", "lion", "tiger", "wolf", "deer", "zebra", "panda", "koala",
  "eagle", "hawk", "owl", "duck", "swan", "robin", "sparrow", "penguin", "parrot", "flamingo",
  "shark", "whale", "dolphin", "octopus", "squid", "crab", "lobster", "jellyfish", "starfish",
  "snake", "lizard", "frog", "toad", "turtle", "snail", "spider", "bee", "ant", "butterfly",
  "elephant", "giraffe", "monkey", "gorilla", "chimpanzee", "hippopotamus", "rhinoceros", "camel",
  "horse", "cow", "pig", "sheep", "goat", "chicken", "rabbit", "mouse", "rat", "squirrel", "badger"
];

const generateRandomHostCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  return `${randomColor}${randomAnimal}`;
};

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  fetchProfile: () => Promise<void>;
  
  // Local first name for unauthenticated users
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;

  // Session history and stats data
  sessions: SessionHistory[];
  setSessions: React.Dispatch<React.SetStateAction<SessionHistory[]>>;
  statsData: StatsData;
  setStatsData: React.Dispatch<React.SetStateAction<StatsData>>;

  // Persistent states for History and Leaderboard time filters
  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardFocusTimePeriod: TimePeriod;
  setLeaderboardFocusTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardCollaborationTimePeriod: TimePeriod;
  setLeaderboardCollaborationTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;

  // Function to save session
  saveSession: (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
    activeAsks?: ActiveAskItem[] // NEW: Add activeAsks parameter and make it optional
  ) => Promise<void>;

  // NEW: Blocked users and related functions
  blockedUsers: string[];
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  recentCoworkers: string[]; // NEW: List of unique coworker names

  // NEW: Host code and its setter
  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;

  // NEW: Function to delete a session
  deleteSession: (sessionId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

const LOCAL_STORAGE_KEY = 'deepsesh_profile_data'; // New local storage key for profile data
const LOCAL_FIRST_NAME_KEY = 'deepsesh_local_first_name'; // New local storage key for local first name
const BLOCKED_USERS_KEY = 'deepsesh_blocked_users'; // NEW: Local storage key for blocked users
const LOCAL_STORAGE_HOST_CODE_KEY = 'deepsesh_host_code'; // NEW: Local storage key for host code
const LOCAL_STORAGE_SESSIONS_KEY = 'deepsesh_local_sessions'; // NEW: Local storage key for sessions

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localFirstName, setLocalFirstName] = useState("You"); // New state for local first name

  // Session history and stats data states
  const [sessions, setSessions] = useState<SessionHistory[]>(initialSessions);
  const [statsData, setStatsData] = useState<StatsData>(initialStatsData);

  // Persistent states for History and Leaderboard time filters
  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod] = useState<TimePeriod>('week');

  // NEW: Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // NEW: Host code state
  const [hostCode, setHostCode] = useState("");

  // Derived state for recent coworkers
  const recentCoworkers = useMemo(() => {
    const uniqueNames = new Set<string>();
    // For demo, we'll use mock data from Index.tsx for recent coworkers
    // In a real app, this would come from actual session participants in the database
    const mockNearbyParticipants = [
      { id: "1", name: "Alex", sociability: 90, intention: "Reviewing differential equations." },
      { id: "2", name: "Sam", sociability: 80, intention: "Working on problem set 3." },
      { id: "3", name: "Taylor", sociability: 90, intention: "Preparing for the midterm exam." },
      { id: "4", name: "Morgan", sociability: 20, intention: "Debugging a Python script." },
      { id: "5", name: "Jordan", sociability: 10, intention: "Writing documentation for API." },
      { id: "6", name: "Casey", sociability: 20, intention: "Learning new framework." },
      { id: "7", name: "Riley", sociability: 20, intention: "Code refactoring." },
      { id: "8", name: "Avery", sociability: 30, intention: "Designing database schema." },
    ];
    const mockFriendsParticipants = [
      { id: "9", name: "Jamie", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: "10", name: "Quinn", sociability: 60, intention: "Memorizing key terms." },
      { id: "11", name: "Blake", sociability: 70, intention: "Practicing essay questions." },
      { id: "12", name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: "13", name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: "14", name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: "15", name: "Taylor", sociability: 65, intention: "Collaborating on study guide." },
      { id: "16", name: "Jess", sociability: 70, intention: "Peer teaching." },
    ];

    [...mockNearbyParticipants, ...mockFriendsParticipants].forEach(p => uniqueNames.add(p.name));
    
    // Also add names from the initialSessions data
    // Note: initialSessions doesn't have participant names directly, only count.
    // If it had a list of participant objects, we'd iterate through them.
    // For now, we'll rely on the mock data above.

    return Array.from(uniqueNames).sort();
  }, [sessions]); // sessions is a dependency, but currently doesn't contain participant names for derivation

  const blockUser = useCallback((userName: string) => {
    const trimmedName = userName.trim();
    if (trimmedName && !blockedUsers.includes(trimmedName)) {
      setBlockedUsers(prev => [...prev, trimmedName]);
      toast.success(`'${trimmedName}' has been blocked.`, {
        description: "They will no longer see your sessions.",
      });
    } else if (trimmedName && blockedUsers.includes(trimmedName)) {
      toast.info(`'${trimmedName}' is already blocked.`, {
        description: "No changes made.",
      });
    }
  }, [blockedUsers, toast]);

  const unblockUser = useCallback((userName: string) => {
    const trimmedName = userName.trim();
    if (trimmedName && blockedUsers.includes(trimmedName)) {
      setBlockedUsers(prev => prev.filter(name => name !== trimmedName));
      toast.success(`'${trimmedName}' has been unblocked.`, {
        description: "They can now see your sessions again.",
      });
    } else if (trimmedName && !blockedUsers.includes(trimmedName)) {
      toast.info(`'${trimmedName}' is not in your blocked list.`, {
        description: "No changes made.",
      });
    }
  }, [blockedUsers, toast]);


  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    let localSessions: SessionHistory[] = [];
    const storedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (storedSessions) {
      localSessions = JSON.parse(storedSessions);
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      // If no user, load host code from local storage or generate new
      const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
      if (storedHostCode) {
        setHostCode(storedHostCode);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      }
      setSessions(localSessions.length > 0 ? localSessions : initialSessions); // Use local or initial
      return;
    }

    // Attempt to fetch the profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // If an error occurred during fetch AND it's not the "no rows found" error,
    // then it's a genuine error we should report.
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching profile:", fetchError);
      setError(fetchError.message);
      toast.error("Error fetching profile", {
        description: fetchError.message,
      });
      setProfile(null); // Ensure profile is null on error
      setLoading(false);
      // Even on error, ensure hostCode is set from local storage if available
      const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
      if (storedHostCode) {
        setHostCode(storedHostCode);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      }
      setSessions(localSessions.length > 0 ? localSessions : initialSessions); // Fallback to local or initial
      return;
    }

    if (existingProfile) {
      // Profile found
      setProfile({ ...existingProfile, first_name: existingProfile.first_name || "" });
      // If profile has host_code, use it. Otherwise, generate one and update DB.
      if (existingProfile.host_code) {
        setHostCode(existingProfile.host_code);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, existingProfile.host_code); // Keep local storage in sync
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
        await updateProfile({ host_code: newHostCode }); // Update DB
      }
      console.log("Profile fetched from Supabase:", { ...existingProfile, first_name: existingProfile.first_name || "" });
    } else {
      // No profile found (either data is null or PGRST116 error occurred), attempt to create one
      console.log("No existing profile found for user, attempting to create one.");
      const newHostCode = generateRandomHostCode(); // Generate host code for new user
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id, 
          first_name: user.user_metadata.first_name, 
          last_name: user.user_metadata.last_name,
          host_code: newHostCode // Include host_code in initial insert
        })
        .select()
        .single(); // Still using .single() here, which is fine for an insert that returns one row

      if (insertError) {
        console.error("Error creating profile:", insertError);
        setError(insertError.message);
        toast.error("Error creating profile", {
          description: insertError.message,
        });
        setProfile(null); // Ensure profile is null on error
        // Fallback for hostCode if profile creation fails
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      } else if (newProfile) {
        setProfile({ ...newProfile, first_name: newProfile.first_name || "" });
        setHostCode(newProfile.host_code || newHostCode); // Use newProfile's host_code or fallback
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newProfile.host_code || newHostCode);
        console.log("New profile created in Supabase:", { ...newProfile, first_name: newProfile.first_name || "" });
      }
    }

    // NEW: Fetch sessions from Supabase for authenticated users, including notes and active_asks
    const { data: fetchedSupabaseSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, break_duration_seconds, coworker_count, created_at, focus_duration_seconds, session_end_time, session_start_time, total_session_seconds, user_id, active_asks, notes') // Added active_asks and notes
      .eq('user_id', user.id)
      .order('session_start_time', { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      setError(sessionsError.message);
      toast.error("Error fetching sessions", {
        description: sessionsError.message,
      });
      setSessions(localSessions.length > 0 ? localSessions : initialSessions); // Fallback to local or initial
    } else if (fetchedSupabaseSessions) {
      const supabaseSessionsMap = new Map<string, Tables<'public', 'sessions'>>();
      fetchedSupabaseSessions.forEach(s => supabaseSessionsMap.set(s.id, s));

      const mergedSessions: SessionHistory[] = [];
      const processedSupabaseIds = new Set<string>();

      // 1. Add local sessions, merging with Supabase data if available
      localSessions.forEach(localSesh => {
        const supabaseSesh = supabaseSessionsMap.get(localSesh.id);
        if (supabaseSesh) {
          // Merge: use Supabase core data, but local notes/asks
          mergedSessions.push({
            id: supabaseSesh.id,
            title: supabaseSesh.title,
            date: supabaseSesh.session_start_time,
            duration: formatSecondsToDurationString(supabaseSesh.total_session_seconds),
            participants: supabaseSesh.coworker_count,
            type: supabaseSesh.focus_duration_seconds > supabaseSesh.break_duration_seconds ? 'focus' : 'break',
            notes: localSesh.notes, // Use local notes
            asks: localSesh.asks, // Use local asks (was polls)
            session_start_time: supabaseSesh.session_start_time,
            session_end_time: supabaseSesh.session_end_time,
          });
          processedSupabaseIds.add(supabaseSesh.id);
        } else {
          // Purely local session (not in Supabase)
          mergedSessions.push(localSesh);
        }
      });

      // 2. Add Supabase sessions that were not in local storage
      fetchedSupabaseSessions.forEach(supabaseSesh => {
        if (!processedSupabaseIds.has(supabaseSesh.id)) {
          mergedSessions.push({
            id: supabaseSesh.id,
            title: supabaseSesh.title,
            date: supabaseSesh.session_start_time,
            duration: formatSecondsToDurationString(supabaseSesh.total_session_seconds),
            participants: supabaseSesh.coworker_count,
            type: supabaseSesh.focus_duration_seconds > supabaseSesh.break_duration_seconds ? 'focus' : 'break',
            notes: supabaseSesh.notes || '', // Use Supabase notes
            asks: supabaseSesh.active_asks as ActiveAskItem[] | undefined, // Use Supabase active_asks
            session_start_time: supabaseSesh.session_start_time,
            session_end_time: supabaseSesh.session_end_time,
          });
        }
      });

      // Sort the merged sessions by date (most recent first)
      mergedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSessions(mergedSessions);
      console.log("Sessions fetched and merged:", mergedSessions);
    }
    setLoading(false);
  };

  const updateProfile = async (data: ProfileUpdate) => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      toast.error("Authentication required", {
        description: "Please log in to update your profile.",
      });
      return;
    }

    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
      toast.error("Error updating profile", {
        description: error.message,
      });
    } else if (updatedData) {
      // Ensure first_name is always a string
      setProfile({ ...updatedData, first_name: updatedData.first_name || "" });
      // Update hostCode state and local storage if host_code was part of the update
      if (updatedData.host_code) {
        setHostCode(updatedData.host_code);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, updatedData.host_code);
      }
      console.log("Profile updated in Supabase and context:", { ...updatedData, first_name: updatedData.first_name || "" });
      toast.success("Profile updated!", {
        description: "Your profile has been successfully saved.",
      });
    }
    setLoading(false);
  };

  const saveSession = async (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
    activeAsks: ActiveAskItem[] | undefined // Make it explicitly optional here
  ) => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    // Define newSessionDate and sessionEndTime
    const newSessionDate = new Date(sessionStartTime);
    const sessionEndTime = new Date(sessionStartTime + totalSessionSeconds * 1000);

    const currentActiveAsks = activeAsks ?? [];
    // Removed pollsToSave filtering, now saving all asks

    const newSession: SessionHistory = {
      id: crypto.randomUUID(), // Generate a UUID for local session ID
      title: seshTitle,
      date: newSessionDate.toISOString(), // Store full ISO string for better date handling
      duration: formatSecondsToDurationString(totalSessionSeconds),
      participants: activeJoinedSessionCoworkerCount,
      type: finalAccumulatedFocusSeconds > 0 ? 'focus' : 'break',
      notes: notes,
      asks: currentActiveAsks.length > 0 ? currentActiveAsks : undefined, // Save all activeAsks
      session_start_time: newSessionDate.toISOString(), // Populate new field
      session_end_time: sessionEndTime.toISOString(),   // Populate new field
    };

    // Always update local storage first with the full session data (including notes/asks)
    setSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions];
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });

    // Update local stats data for 'week', 'month', and 'all' time
    setStatsData(prevStats => {
      const updatedStats = { ...prevStats };

      // Helper to update a specific period's stats
      const updatePeriodStats = (period: TimePeriod) => {
        const currentPeriodStats = updatedStats[period];
        const updatedTotalFocusSeconds = parseDurationStringToSeconds(currentPeriodStats.totalFocusTime) + finalAccumulatedFocusSeconds;
        const updatedUniqueCoworkers = currentPeriodStats.uniqueCoworkers + activeJoinedSessionCoworkerCount; // Simple addition for demo

        updatedStats[period] = {
          ...currentPeriodStats,
          totalFocusTime: formatSecondsToDurationString(updatedTotalFocusSeconds),
          sessionsCompleted: currentPeriodStats.sessionsCompleted + 1,
          uniqueCoworkers: updatedUniqueCoworkers,
          // Ranks are static in demo, so they are not updated here
        };
      };

      // Update 'all' time stats
      updatePeriodStats('all');

      // Update 'week' stats if session is in current week
      if (isDateInCurrentWeek(newSessionDate, new Date())) { // Pass a new Date object for comparison
        updatePeriodStats('week');
      }

      // Update 'month' stats if session is in current month
      if (isDateInCurrentMonth(newSessionDate, new Date())) { // Pass a new Date object for comparison
        updatePeriodStats('month');
      }

      return updatedStats;
    });

    if (!user) {
      // User not authenticated, local save is complete
      toast.success("Session saved locally!", {
        description: "Your session has been recorded in this browser.",
      });
      setLoading(false);
      return;
    }

    // If user is authenticated, save core session data to Supabase (including notes and active_asks)
    const sessionData: TablesInsert<'public', 'sessions'> = {
      id: newSession.id, // Use the generated UUID as Supabase ID
      user_id: user.id,
      title: seshTitle,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: newSessionDate.toISOString(),
      session_end_time: sessionEndTime.toISOString(),
      active_asks: currentActiveAsks as unknown as Json, // Save active_asks to Supabase
      notes: notes, // Save notes to Supabase
    };

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select('id') // Only need the ID back to confirm insertion
      .single();

    if (insertError) {
      console.error("Error saving session to Supabase:", insertError);
      setError(insertError.message);
      toast.error("Error saving session", {
        description: `Failed to save core session data to cloud. Notes and asks are saved locally. ${insertError.message}`,
      });
    } else if (data) {
      console.log("Core session data saved to Supabase:", data);
      toast.success("Session saved!", {
        description: "Your session has been successfully recorded.",
      });
    }
    setLoading(false);
  };

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    // Always update local storage first
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.id !== sessionId);
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });
    // Recalculate stats for local deletion (simplified for demo)
    setStatsData(initialStatsData); // Reset to initial for simplicity in demo

    if (!user) {
      setLoading(false);
      return; // Exit if not authenticated, local delete is done
    }

    // If user is authenticated, delete from Supabase
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error("Error deleting session from Supabase:", deleteError);
      setError(deleteError.message);
      toast.error("Error deleting session", {
        description: `Failed to delete core session data from cloud. Local data removed. ${deleteError.message}`,
      });
    } else {
      console.log("Core session data deleted from Supabase:", sessionId);
    }
    setLoading(false);
  }, [toast]);


  // Initial load effect
  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      setProfile(data.profile ?? null);
      console.log("Profile loaded from local storage:", data.profile?.first_name);
      // Sessions are now fetched by fetchProfile, so remove from here
      setStatsData(data.statsData ?? initialStatsData);
      setHistoryTimePeriod(data.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(data.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(data.leaderboardCollaborationTimePeriod ?? 'week');
    }

    const storedLocalFirstName = localStorage.getItem(LOCAL_FIRST_NAME_KEY);
    if (storedLocalFirstName) {
      setLocalFirstName(storedLocalFirstName);
    }

    // NEW: Load blocked users from local storage
    const storedBlockedUsers = localStorage.getItem(BLOCKED_USERS_KEY);
    if (storedBlockedUsers) {
      setBlockedUsers(JSON.parse(storedBlockedUsers));
    }
    
    fetchProfile(); // Always try to fetch the latest profile and sessions from Supabase
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(); // Refetch profile and sessions on login
      } else {
        setProfile(null);
        // When logging out, ensure hostCode is loaded from local storage or generated
        const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
        if (storedHostCode) {
          setHostCode(storedHostCode);
        } else {
          const newHostCode = generateRandomHostCode();
          setHostCode(newHostCode);
          localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
        }
        // Also load local sessions when logging out
        const storedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
        if (storedSessions) {
          setSessions(JSON.parse(storedSessions));
        } else {
          setSessions(initialSessions);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Save profile and related data to local storage whenever they change
  useEffect(() => {
    const dataToSave = {
      profile,
      // Sessions are now managed separately in local storage
      statsData,
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("Profile saved to local storage:", profile?.first_name);
  }, [
    profile, statsData,
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
  ]);

  // Save localFirstName to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_FIRST_NAME_KEY, localFirstName);
  }, [localFirstName]);

  // NEW: Save blockedUsers to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  // NEW: Save hostCode to local storage whenever it changes (if not authenticated)
  useEffect(() => {
    // This useEffect ensures that if hostCode changes (e.g., user edits it while logged out),
    // it's immediately saved to local storage.
    // For authenticated users, hostCode is also updated in local storage via fetchProfile/updateProfile.
    if (hostCode) { // Only save if hostCode is not empty
      localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, hostCode);
    }
  }, [hostCode]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile,
    localFirstName,
    setLocalFirstName,
    sessions,
    setSessions,
    statsData,
    setStatsData,
    historyTimePeriod,
    setHistoryTimePeriod,
    leaderboardFocusTimePeriod,
    setLeaderboardFocusTimePeriod,
    leaderboardCollaborationTimePeriod,
    setLeaderboardCollaborationTimePeriod,
    saveSession,
    blockedUsers, // NEW
    blockUser,    // NEW
    unblockUser,  // NEW
    recentCoworkers, // NEW
    hostCode, // NEW
    setHostCode, // NEW
    deleteSession, // NEW
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};