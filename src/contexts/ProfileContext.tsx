import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";
import { toast } from 'sonner';
import { Poll, ActiveAskItem, ExtendSuggestion } from "@/types/timer";
import { useAuth } from "./AuthContext"; // Import useAuth to get current user ID

type Profile = Tables<'public', 'profiles'>;
type ProfileInsert = TablesInsert<'public', 'profiles'>;
type ProfileUpdate = TablesInsert<'public', 'profiles'>;

export type TimePeriod = 'week' | 'month' | 'all';

export interface SessionHistory {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
  type: 'focus' | 'break';
  notes: string;
  asks?: ActiveAskItem[];
  session_start_time: string;
  session_end_time:   string;
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

// Helper function to parse "XXh YYm" to total hours (number) for ranking
const parseDurationStringToHours = (durationString: string): number => {
  const matchHours = durationString.match(/(\d+)h/);
  const matchMinutes = durationString.match(/(\d+)m/);
  let hours = 0;
  let minutes = 0;

  if (matchHours) {
    hours = parseInt(matchHours[1], 10);
  }
  if (matchMinutes) {
    minutes = parseInt(matchMinutes[1], 10);
  }
  return hours + (minutes / 60);
};

// Helper to check if a session date falls within the current week (starting Monday)
const isDateInCurrentWeek = (sessionDate: Date, today: Date): boolean => {
  const startOfWeek = new Date(today);
  const day = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const diff = day === 0 ? 6 : day - 1; // Days to subtract to get to Monday
  startOfWeek.setDate(today.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Set to Sunday of current week
  endOfWeek.setHours(23, 59, 59, 999);

  return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
};

// Helper to check if a session date falls within the current month (starting 1st)
const isDateInCurrentMonth = (sessionDate: Date, today: Date): boolean => {
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
  endOfMonth.setHours(23, 59, 59, 999);

  return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
};

// Dummy Leaderboard Data (consistent with Leaderboard.tsx)
const dummyLeaderboardFocusHours = {
  week: [
    { id: "angie-id-1", name: "Angie", focusHours: 30 },
    { id: "bob-id-1", name: "Bob", focusHours: 25 },
    { id: "charlie-id-1", name: "Charlie", focusHours: 20 },
    { id: "diana-id-1", name: "Diana", focusHours: 18 },
  ],
  month: [
    { id: "angie-id-2", name: "Angie", focusHours: 120 },
    { id: "bob-id-2", name: "Bob", focusHours: 110 },
    { id: "diana-id-2", name: "Diana", focusHours: 95 },
    { id: "charlie-id-2", name: "Charlie", focusHours: 80 },
  ],
  all: [
    { id: "angie-id-3", name: "Angie", focusHours: 500 },
    { id: "bob-id-3", name: "Bob", focusHours: 450 },
    { id: "charlie-id-3", name: "Charlie", focusHours: 400 },
    { id: "diana-id-3", name: "Diana", focusHours: 350 },
  ],
};

const dummyLeaderboardCollaboratedUsers = {
  week: [
    { id: "angie-id-4", name: "Angie", collaboratedUsers: 8 },
    { id: "frank-id-4", name: "Frank", collaboratedUsers: 7 },
    { id: "grace-id-4", name: "Grace", collaboratedUsers: 6 },
    { id: "heidi-id-4", name: "Heidi", collaboratedUsers: 4 },
  ],
  month: [
    { id: "angie-id-5", name: "Angie", collaboratedUsers: 25 },
    { id: "liam-id-5", name: "Liam", collaboratedUsers: 22 },
    { id: "mia-id-5", name: "Mia", collaboratedUsers: 17 },
    { id: "noah-id-5", name: "Noah", collaboratedUsers: 15 },
  ],
  all: [
    { id: "angie-id-6", name: "Angie", collaboratedUsers: 100 },
    { id: "peter-id-6", name: "Peter", collaboratedUsers: 90 },
    { id: "quinn-id-6", name: "Quinn", collaboratedUsers: 80 },
    { id: "rachel-id-6", name: "Rachel", collaboratedUsers: 70 },
  ],
};

// Function to calculate stats from a list of sessions
const calculateStats = (allSessions: SessionHistory[], currentUserId: string | undefined, currentUserName: string): StatsData => {
  const today = new Date();
  const stats: StatsData = {
    week: { totalFocusTime: "0h 0m", sessionsCompleted: 0, uniqueCoworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    month: { totalFocusTime: "0h 0m", sessionsCompleted: 0, uniqueCoworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    all: { totalFocusTime: "0h 0m", sessionsCompleted: 0, uniqueCoworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
  };

  const periods: TimePeriod[] = ['week', 'month', 'all'];

  periods.forEach(period => {
    let totalFocusSeconds = 0;
    let totalCoworkers = 0;
    let sessionsCompleted = 0;

    allSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const focusSeconds = session.type === 'focus' ? parseDurationStringToSeconds(session.duration) : 0;
      const sessionCoworkers = session.participants;

      let includeSession = false;
      if (period === 'all') {
        includeSession = true;
      } else if (period === 'week') {
        includeSession = isDateInCurrentWeek(sessionDate, today);
      } else if (period === 'month') {
        includeSession = isDateInCurrentMonth(sessionDate, today);
      }

      if (includeSession) {
        totalFocusSeconds += focusSeconds;
        totalCoworkers += sessionCoworkers;
        sessionsCompleted++;
      }
    });

    const userFocusHours = parseDurationStringToHours(formatSecondsToDurationString(totalFocusSeconds));
    const userCoworkers = totalCoworkers;

    // Calculate Focus Rank
    const focusLeaderboard = [...dummyLeaderboardFocusHours[period]];
    const existingUserFocusIndex = focusLeaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserFocusIndex !== -1) {
      focusLeaderboard[existingUserFocusIndex] = { id: currentUserId || "mock-user", name: currentUserName, focusHours: userFocusHours };
    } else {
      focusLeaderboard.push({ id: currentUserId || "mock-user", name: currentUserName, focusHours: userFocusHours });
    }
    focusLeaderboard.sort((a, b) => b.focusHours - a.focusHours);
    const userFocusRank = focusLeaderboard.findIndex(user => user.id === currentUserId) + 1;

    // Calculate Coworker Rank
    const collaborationLeaderboard = [...dummyLeaderboardCollaboratedUsers[period]];
    const existingUserCollaborationIndex = collaborationLeaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserCollaborationIndex !== -1) {
      collaborationLeaderboard[existingUserCollaborationIndex] = { id: currentUserId || "mock-user", name: currentUserName, collaboratedUsers: userCoworkers };
    } else {
      collaborationLeaderboard.push({ id: currentUserId || "mock-user", name: currentUserName, collaboratedUsers: userCoworkers });
    }
    collaborationLeaderboard.sort((a, b) => b.collaboratedUsers - a.collaboratedUsers);
    const userCoworkerRank = collaborationLeaderboard.findIndex(user => user.id === currentUserId) + 1;

    stats[period].totalFocusTime = formatSecondsToDurationString(totalFocusSeconds);
    stats[period].sessionsCompleted = sessionsCompleted;
    stats[period].uniqueCoworkers = totalCoworkers;
    stats[period].focusRank = userFocusRank > 0 ? `#${userFocusRank}` : "N/A";
    stats[period].coworkerRank = userCoworkerRank > 0 ? `#${userCoworkerRank}` : "N/A";
  });

  return stats;
};


const initialSessions: SessionHistory[] = [
  {
    id: crypto.randomUUID(),
    title: "Deep Work Sprint",
    date: new Date("2225-09-15T09:00:00Z").toISOString(),
    duration: "45 mins",
    participants: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    asks: [],
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
    asks: [],
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
    asks: [],
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
    asks: [],
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
    asks: [],
    session_start_time: new Date("2225-09-11T16:00:00Z").toISOString(),
    session_end_time: new Date("2225-09-11T17:00:00Z").toISOString(),
  }
];


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
  
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;

  sessions: SessionHistory[];
  setSessions: React.Dispatch<React.SetStateAction<SessionHistory[]>>;
  statsData: StatsData;

  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardFocusTimePeriod: TimePeriod;
  setLeaderboardFocusTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  leaderboardCollaborationTimePeriod: TimePeriod;
  setLeaderboardCollaborationTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;

  saveSession: (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
    activeAsks?: ActiveAskItem[]
  ) => Promise<void>;

  blockedUsers: string[];
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  recentCoworkers: string[];

  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;

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

const LOCAL_STORAGE_KEY = 'deepsesh_profile_data';
const LOCAL_FIRST_NAME_KEY = 'deepsesh_local_first_name';
const BLOCKED_USERS_KEY = 'deepsesh_blocked_users';
const LOCAL_STORAGE_HOST_CODE_KEY = 'deepsesh_host_code';
const LOCAL_STORAGE_SESSIONS_KEY = 'deepsesh_local_sessions';

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const { user } = useAuth(); // Get user from AuthContext
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localFirstName, setLocalFirstName] = useState("You");

  const [sessions, setSessions] = useState<SessionHistory[]>(initialSessions);
  
  // Pass currentUserId and localFirstName to calculateStats
  const statsData = useMemo(() => calculateStats(sessions, user?.id, localFirstName), [sessions, user?.id, localFirstName]);

  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardFocusTimePeriod, setLeaderboardFocusTimePeriod] = useState<TimePeriod>('week');
  const [leaderboardCollaborationTimePeriod, setLeaderboardCollaborationTimePeriod] = useState<TimePeriod>('week');

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [hostCode, setHostCode] = useState("");

  const recentCoworkers = useMemo(() => {
    const uniqueNames = new Set<string>();
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
    
    return Array.from(uniqueNames).sort();
  }, [sessions]);

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
      const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
      if (storedHostCode) {
        setHostCode(storedHostCode);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      }
      setSessions(localSessions.length > 0 ? localSessions : initialSessions);
      return;
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching profile:", fetchError);
      setError(fetchError.message);
      toast.error("Error fetching profile", {
        description: fetchError.message,
      });
      setProfile(null);
      setLoading(false);
      const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
      if (storedHostCode) {
        setHostCode(storedHostCode);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      }
      setSessions(localSessions.length > 0 ? localSessions : initialSessions);
      return;
    }

    if (existingProfile) {
      setProfile({ ...existingProfile, first_name: existingProfile.first_name || "" });
      if (existingProfile.host_code) {
        setHostCode(existingProfile.host_code);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, existingProfile.host_code);
      } else {
        const newHostCode = generateRandomHostCode();
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
        await updateProfile({ host_code: newHostCode });
      }
      console.log("Profile fetched from Supabase:", { ...existingProfile, first_name: existingProfile.first_name || "" });
    } else {
      console.log("No existing profile found for user, attempting to create one.");
      const newHostCode = generateRandomHostCode();
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id, 
          first_name: user.user_metadata.first_name, 
          last_name: user.user_metadata.last_name,
          host_code: newHostCode
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        setError(insertError.message);
        toast.error("Error creating profile", {
          description: insertError.message,
        });
        setProfile(null);
        setHostCode(newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
      } else if (newProfile) {
        setProfile({ ...newProfile, first_name: newProfile.first_name || "" });
        setHostCode(newProfile.host_code || newHostCode);
        localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newProfile.host_code || newHostCode);
        console.log("New profile created in Supabase:", { ...newProfile, first_name: newProfile.first_name || "" });
      }
    }

    const { data: fetchedSupabaseSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, break_duration_seconds, coworker_count, created_at, focus_duration_seconds, session_end_time, session_start_time, total_session_seconds, user_id, active_asks, notes')
      .eq('user_id', user.id)
      .order('session_start_time', { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      setError(sessionsError.message);
      toast.error("Error fetching sessions", {
        description: sessionsError.message,
      });
      setSessions(localSessions.length > 0 ? localSessions : initialSessions);
    } else if (fetchedSupabaseSessions) {
      const supabaseSessionsMap = new Map<string, Tables<'public', 'sessions'>>();
      fetchedSupabaseSessions.forEach(s => supabaseSessionsMap.set(s.id, s));

      const mergedSessions: SessionHistory[] = [];
      const processedSupabaseIds = new Set<string>();

      localSessions.forEach(localSesh => {
        const supabaseSesh = supabaseSessionsMap.get(localSesh.id);
        if (supabaseSesh) {
          mergedSessions.push({
            id: supabaseSesh.id,
            title: supabaseSesh.title,
            date: supabaseSesh.session_start_time,
            duration: formatSecondsToDurationString(supabaseSesh.total_session_seconds),
            participants: supabaseSesh.coworker_count,
            type: supabaseSesh.focus_duration_seconds > supabaseSesh.break_duration_seconds ? 'focus' : 'break',
            notes: localSesh.notes,
            asks: localSesh.asks,
            session_start_time: supabaseSesh.session_start_time,
            session_end_time: supabaseSesh.session_end_time,
          });
          processedSupabaseIds.add(supabaseSesh.id);
        } else {
          mergedSessions.push(localSesh);
        }
      });

      fetchedSupabaseSessions.forEach(supabaseSesh => {
        if (!processedSupabaseIds.has(supabaseSesh.id)) {
          mergedSessions.push({
            id: supabaseSesh.id,
            title: supabaseSesh.title,
            date: supabaseSesh.session_start_time,
            duration: formatSecondsToDurationString(supabaseSesh.total_session_seconds),
            participants: supabaseSesh.coworker_count,
            type: supabaseSesh.focus_duration_seconds > supabaseSesh.break_duration_seconds ? 'focus' : 'break',
            notes: supabaseSesh.notes || '',
            asks: (supabaseSesh.active_asks || []) as ActiveAskItem[],
            session_start_time: supabaseSesh.session_start_time,
            session_end_time: supabaseSesh.session_end_time,
          });
        }
      });

      mergedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSessions(mergedSessions);
      console.log("ProfileContext: Sessions fetched and merged:", mergedSessions);
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
      setProfile({ ...updatedData, first_name: updatedData.first_name || "" });
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
    activeAsks: ActiveAskItem[] | undefined
  ) => {
    setLoading(true);
    setError(null);
    const { data: { user } = {} } = await supabase.auth.getUser();

    console.log("ProfileContext: saveSession received activeAsks:", activeAsks);

    const newSessionDate = new Date(sessionStartTime);
    const sessionEndTime = new Date(sessionStartTime + totalSessionSeconds * 1000);

    const currentActiveAsks = activeAsks ?? [];
    console.log("ProfileContext: currentActiveAsks for new session:", currentActiveAsks);

    const newSession: SessionHistory = {
      id: crypto.randomUUID(),
      title: seshTitle,
      date: newSessionDate.toISOString(),
      duration: formatSecondsToDurationString(totalSessionSeconds),
      participants: activeJoinedSessionCoworkerCount,
      type: finalAccumulatedFocusSeconds > 0 ? 'focus' : 'break',
      notes: notes,
      asks: currentActiveAsks.length > 0 ? currentActiveAsks : undefined,
      session_start_time: newSessionDate.toISOString(),
      session_end_time: sessionEndTime.toISOString(),
    };
    console.log("ProfileContext: newSession.asks will be:", newSession.asks);

    setSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions];
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
      console.log("ProfileContext: Sessions saved to local storage:", updatedSessions);
      return updatedSessions;
    });

    if (!user) {
      toast.success("Session saved locally!", {
        description: "Your session has been recorded in this browser.",
      });
      setLoading(false);
      return;
    }

    const sessionData: TablesInsert<'public', 'sessions'> = {
      id: newSession.id,
      user_id: user.id,
      title: seshTitle,
      focus_duration_seconds: Math.round(finalAccumulatedFocusSeconds),
      break_duration_seconds: Math.round(finalAccumulatedBreakSeconds),
      total_session_seconds: Math.round(totalSessionSeconds),
      coworker_count: activeJoinedSessionCoworkerCount,
      session_start_time: newSessionDate.toISOString(),
      session_end_time: sessionEndTime.toISOString(),
      active_asks: currentActiveAsks as unknown as Json,
      notes: notes,
    };

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select('id')
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
    const { data: { user } = {} } = await supabase.auth.getUser();

    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.id !== sessionId);
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updatedSessions));
      return updatedSessions;
    });

    if (!user) {
      setLoading(false);
      return;
    }

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


  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      setProfile(data.profile ?? null);
      console.log("Profile loaded from local storage:", data.profile?.first_name);
      setHistoryTimePeriod(data.historyTimePeriod ?? 'week');
      setLeaderboardFocusTimePeriod(data.leaderboardFocusTimePeriod ?? 'week');
      setLeaderboardCollaborationTimePeriod(data.leaderboardCollaborationTimePeriod ?? 'week');
    }

    const storedLocalFirstName = localStorage.getItem(LOCAL_FIRST_NAME_KEY);
    if (storedLocalFirstName) {
      setLocalFirstName(storedLocalFirstName);
    }

    const storedBlockedUsers = localStorage.getItem(BLOCKED_USERS_KEY);
    if (storedBlockedUsers) {
      setBlockedUsers(JSON.parse(storedBlockedUsers));
    }
    
    fetchProfile();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
        const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
        if (storedHostCode) {
          setHostCode(storedHostCode);
        } else {
          const newHostCode = generateRandomHostCode();
          setHostCode(newHostCode);
          localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, newHostCode);
        }
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

  useEffect(() => {
    const dataToSave = {
      profile,
      historyTimePeriod,
      leaderboardFocusTimePeriod,
      leaderboardCollaborationTimePeriod,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("Profile saved to local storage:", profile?.first_name);
  }, [
    profile,
    historyTimePeriod, leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod,
  ]);

  useEffect(() => {
    localStorage.setItem(LOCAL_FIRST_NAME_KEY, localFirstName);
  }, [localFirstName]);

  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    if (hostCode) {
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
    historyTimePeriod,
    setHistoryTimePeriod,
    leaderboardFocusTimePeriod,
    setLeaderboardFocusTimePeriod,
    leaderboardCollaborationTimePeriod,
    setLeaderboardCollaborationTimePeriod,
    saveSession,
    blockedUsers,
    blockUser,
    unblockUser,
    recentCoworkers,
    hostCode,
    setHostCode,
    deleteSession,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};