import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from 'sonner'; // Using sonner for notifications
import { ActiveAskItem } from '@/types/timer'; // NEW: Import ActiveAskItem type
import { Session } from '@supabase/supabase-js'; // NEW: Import Session type

type Profile = Tables<'public', 'profiles'>;
type ProfileInsert = TablesInsert<'public', 'profiles'>;
type ProfileUpdate = TablesUpdate<'public', 'profiles'>;

export type TimePeriod = 'week' | 'month' | 'all'; // Define TimePeriod type

// New types for session history and stats data
export interface SessionHistory {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: number;
  type: 'focus' | 'break';
  notes: string;
  activeAsks: ActiveAskItem[] | null; // NEW: Added activeAsks to SessionHistory
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
  const matchMinutes = durationString.match(/(\d+)m/);
  let totalSeconds = 0;
  if (matchHours) {
    totalSeconds += parseInt(matchHours[1], 10) * 3600;
  }
  if (matchMinutes) {
    totalSeconds += parseInt(matchMinutes[1], 10) * 60;
  }
  return totalSeconds;
};

// Helper to check if a session date falls within the current week
const isDateInCurrentWeek = (sessionDate: Date, today: Date): boolean => {
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
  const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Saturday
  return sessionDate >= firstDayOfWeek && sessionDate <= lastDayOfWeek;
};

// Helper to check if a session date falls within the current month
const isDateInCurrentMonth = (sessionDate: Date, today: Date): boolean => {
  return sessionDate.getMonth() === today.getMonth() && sessionDate.getFullYear() === today.getFullYear();
};


// Initial data for sessions
const initialSessions: SessionHistory[] = [
  {
    id: 1,
    title: "Deep Work Sprint",
    date: "2025-09-15",
    duration: "45 mins",
    participants: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    activeAsks: null, // NEW: Default to null
  },
  {
    id: 2,
    title: "Study Group Alpha",
    date: "2025-09-14",
    duration: "90 mins",
    participants: 5,
    type: "focus",
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
    activeAsks: null, // NEW: Default to null
  },
  {
    id: 3,
    title: "Solo Focus",
    date: "2025-09-13",
    duration: "30 mins",
    participants: 1,
    type: "focus",
    notes: "Quick focused session to review quarterly goals and plan next steps.",
    activeAsks: null, // NEW: Default to null
  },
  {
    id: 4,
    title: "Coding Session",
    date: "2025-09-12",
    duration: "120 mins",
    participants: 2,
    type: "focus",
    notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
    activeAsks: null, // NEW: Default to null
  },
  {
    id: 5,
    title: "Research Deep Dive",
    date: "2025-09-11",
    duration: "60 mins",
    participants: 4,
    type: "focus",
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
    activeAsks: null, // NEW: Default to null
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
    activeAsks: ActiveAskItem[] // NEW: Added activeAsks parameter
  ) => Promise<void>;

  // NEW: Blocked users and related functions
  blockedUsers: string[];
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  recentCoworkers: string[]; // NEW: List of unique coworker names

  // NEW: Host code and its setter
  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;
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
const LOCAL_STORAGE_SESSIONS_KEY = 'deepsesh_local_sessions'; // NEW: Local storage key for local sessions
const LOCAL_STORAGE_STATS_KEY = 'deepsesh_local_stats'; // NEW: Local storage key for local stats

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
      { id: 1, name: "Alex", sociability: 90, intention: "Reviewing differential equations." },
      { id: 2, name: "Sam", sociability: 80, intention: "Working on problem set 3." },
      { id: 3, name: "Taylor", sociability: 90, intention: "Preparing for the midterm exam." },
      { id: 4, name: "Morgan", sociability: 20, intention: "Debugging a Python script." },
      { id: 5, name: "Jordan", sociability: 10, intention: "Writing documentation for API." },
      { id: 6, name: "Casey", sociability: 20, intention: "Learning new framework." },
      { id: 7, name: "Riley", sociability: 20, intention: "Code refactoring." },
      { id: 8, name: "Avery", sociability: 30, intention: "Designing database schema." },
    ];
    const mockFriendsParticipants = [
      { id: 9, name: "Jamie", sociability: 60, intention: "Reviewing cognitive psychology." },
      { id: 10, name: "Quinn", sociability: 60, intention: "Memorizing key terms." },
      { id: 11, name: "Blake", sociability: 70, intention: "Practicing essay questions." },
      { id: 12, name: "Drew", sociability: 60, intention: "Summarizing research papers." },
      { id: 13, name: "Chris", sociability: 50, intention: "Creating flashcards." },
      { id: 14, name: "Pat", sociability: 55, intention: "Discussing theories." },
      { id: 15, name: "Taylor", sociability: 65, intention: "Collaborating on study guide." },
      { id: 16, name: "Jess", sociability: 70, intention: "Peer teaching." },
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
    const { data, error: getUserError } = await supabase.auth.getUser(); // Safer destructuring
    const user = data?.user || null; // Access user safely

    if (getUserError) {
      console.error("Error getting user:", getUserError);
      setError(getUserError.message);
      setProfile(null);
      setLoading(false);
      // If error getting user, still try to load host code from local storage
      const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
      if (storedHostCode) {
        setHostCode(storedHostCode);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      }
      return;
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
    setLoading(false);
  };

  const fetchSessions = async (userId: string) => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start_time', { ascending: false });

    if (fetchError) {
      console.error("Error fetching sessions:", fetchError);
      setError(fetchError.message);
      toast.error("Error fetching sessions", {
        description: fetchError.message,
      });
      setSessions([]);
    } else if (data) {
      const fetchedSessions: SessionHistory[] = data.map(s => ({
        id: parseInt(s.id.substring(0, 8), 16), // Convert UUID to a number for demo consistency
        title: s.title,
        date: s.session_start_time.split('T')[0],
        duration: formatSecondsToDurationString(s.total_session_seconds),
        participants: s.coworker_count,
        type: s.focus_duration_seconds > s.break_duration_seconds ? 'focus' : 'break',
        notes: s.notes || '',
        activeAsks: s.active_asks as ActiveAskItem[] | null, // NEW: Cast JSONB to ActiveAskItem[]
      }));
      setSessions(fetchedSessions);
      // TODO: Recalculate stats based on fetched sessions
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
    activeAsks: ActiveAskItem[] // NEW: Added activeAsks parameter
  ) => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User not authenticated, save locally
      const newSessionDate = new Date(sessionStartTime);
      const today = new Date(); // Get current date for comparison

      const newSession: SessionHistory = {
        id: Date.now(), // Unique ID for local session
        title: seshTitle,
        date: newSessionDate.toISOString().split('T')[0], // YYYY-MM-DD format
        duration: formatSecondsToDurationString(totalSessionSeconds),
        participants: activeJoinedSessionCoworkerCount,
        type: finalAccumulatedFocusSeconds > 0 ? 'focus' : 'break', // Determine type based on focus time
        notes: notes,
        activeAsks: activeAsks.length > 0 ? activeAsks : null, // NEW: Save activeAsks locally
      };

      setSessions(prevSessions => [newSession, ...prevSessions]);

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
        if (isDateInCurrentWeek(newSessionDate, new Date(today))) { // Pass a new Date object for comparison
          updatePeriodStats('week');
        }

        // Update 'month' stats if session is in current month
        if (isDateInCurrentMonth(newSessionDate, new Date(today))) { // Pass a new Date object for comparison
          updatePeriodStats('month');
        }

        return updatedStats;
      });

      toast.success("Session saved locally!", {
        description: "Your session has been recorded in this browser.",
      });
      setLoading(false);
      return; // Exit function after local save
    }

    // If user is authenticated, save to Supabase
    const sessionData: TablesInsert<'public', 'sessions'> = {
      user_id: user.id,
      title: seshTitle,
      notes: notes,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: new Date(sessionStartTime).toISOString(),
      session_end_time: new Date().toISOString(),
      active_asks: activeAsks.length > 0 ? activeAsks : null, // NEW: Save activeAsks to Supabase
    };

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error("Error saving session:", insertError);
      setError(insertError.message);
      toast.error("Error saving session", {
        description: insertError.message,
      });
    } else if (data) {
      console.log("Session saved to Supabase:", data);
      toast.success("Session saved!", {
        description: "Your session has been successfully recorded.",
      });
      // After saving to Supabase, refetch sessions to update the history page
      fetchSessions(user.id);
    }
    setLoading(false);
  };

  // Initial load effect
  useEffect(() => {
    // Load profile data
    const storedProfileData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedProfileData) {
      const data = JSON.parse(storedProfileData);
      setProfile(data.profile ?? null);
      setHistoryTimePeriod(data.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(data.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(data.leaderboardCollaborationTimePeriod ?? 'week');
    }

    // Load local sessions and stats
    const storedLocalSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (storedLocalSessions) {
      setSessions(JSON.parse(storedLocalSessions));
    } else {
      setSessions(initialSessions); // Use initial data if nothing in local storage
    }

    const storedLocalStats = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
    if (storedLocalStats) {
      setStatsData(JSON.parse(storedLocalStats));
    } else {
      setStatsData(initialStatsData); // Use initial data if nothing in local storage
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
    
    const handleAuthChange = async (_event: string, session: Session | null) => {
      if (session) {
        await fetchProfile();
        await fetchSessions(session.user.id);
      } else {
        setProfile(null);
        setSessions(initialSessions); // Reset to initial local sessions on logout
        setStatsData(initialStatsData); // Reset to initial local stats on logout
        // When logging out, ensure hostCode is loaded from local storage or generated
        const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
        if (storedHostCode) {
          setHostCode(storedHostCode);
        } else {
          const newHostCode = generateRandomHostCode();
          setHostCode(newHostCode);
          localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
        }
        setLoading(false); // Ensure loading is set to false if no user
      }
    };

    // Initial fetch based on current session status
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

  // Save profile and related data to local storage whenever they change
  useEffect(() => {
    const dataToSave = {
      profile,
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    profile,
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
  ]);

  // Save local sessions to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Save local stats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(statsData));
  }, [statsData]);

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
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};