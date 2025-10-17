import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";
import { toast } from 'sonner';
import { Poll, ActiveAskItem, ExtendSuggestion } from "@/types/timer";
import { useAuth } from "./AuthContext"; // Import useAuth to get current user ID

export type Profile = Tables<'public', 'profiles'>;
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
  participantNames?: string[]; // NEW: Added participantNames
}

export interface StatsPeriodData {
  totalFocusTime: string;
  sessionsCompleted: number;
  coworkers: number; // Changed from uniqueCoworkers
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
  // If it's just "X mins" (e.g., "45 mins"), parse it directly
  const matchMinsOnly = durationString.match(/(\d+)\s*mins/);
  if (!matchHours && !matchMinutes && matchMinsOnly) {
    totalSeconds += parseInt(matchMinsOnly[1], 10) * 60;
  }
  return totalSeconds;
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

const dummyLeaderboardCoworkers = {
  week: [
    { id: "angie-id-4", name: "Angie", coworkers: 8 },
    { id: "frank-id-4", name: "Frank", coworkers: 7 },
    { id: "grace-id-4", name: "Grace", coworkers: 6 },
    { id: "heidi-id-4", name: "Heidi", coworkers: 4 }, 
  ],
  month: [
    { id: "angie-id-5", name: "Angie", coworkers: 25 },
    { id: "liam-id-5", name: "Liam", coworkers: 22 }, 
    { id: "mia-id-5", name: "Mia", coworkers: 17 }, 
    { id: "noah-id-5", name: "Noah", coworkers: 15 }, 
  ],
  all: [
    { id: "angie-id-6", name: "Angie", coworkers: 100 },
    { id: "peter-id-6", name: "Peter", coworkers: 90 }, 
    { id: "quinn-id-6", name: "Quinn", coworkers: 80 }, 
    { id: "rachel-id-6", name: "Rachel", coworkers: 70 }, 
  ],
};

// Function to calculate stats from a list of sessions
const calculateStats = (allSessions: SessionHistory[], currentUserId: string | undefined, currentUserName: string): StatsData => {
  const today = new Date();
  const stats: StatsData = {
    week: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    month: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    all: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
  };

  const periods: TimePeriod[] = ['week', 'month', 'all'];

  periods.forEach(period => {
    let totalFocusSeconds = 0;
    let totalCoworkerCount = 0;
    let sessionsCompleted = 0;

    allSessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const focusSeconds = session.type === 'focus' ? parseDurationStringToSeconds(session.duration) : 0;
      const sessionCoworkerCount = session.participants;

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
        totalCoworkerCount += sessionCoworkerCount;
        sessionsCompleted++;
      }
    });

    const userFocusHours = parseDurationStringToHours(formatSecondsToDurationString(totalFocusSeconds));
    const userCoworkerCount = totalCoworkerCount;

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
    const collaborationLeaderboard = [...dummyLeaderboardCoworkers[period]];
    const existingUserCollaborationIndex = collaborationLeaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserCollaborationIndex !== -1) {
      collaborationLeaderboard[existingUserCollaborationIndex] = { id: currentUserId || "mock-user", name: currentUserName, coworkers: userCoworkerCount };
    } else {
      collaborationLeaderboard.push({ id: currentUserId || "mock-user", name: currentUserName, coworkers: userCoworkerCount });
    }
    collaborationLeaderboard.sort((a, b) => b.coworkers - a.coworkers);
    const userCoworkerRank = collaborationLeaderboard.findIndex(user => user.id === currentUserId) + 1;

    stats[period].totalFocusTime = formatSecondsToDurationString(totalFocusSeconds);
    stats[period].sessionsCompleted = sessionsCompleted;
    stats[period].coworkers = totalCoworkerCount;
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
    participantNames: ["You", "Alice", "Bob"], // Added mock participant names
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
    participantNames: ["You", "Charlie", "Diana", "Eve", "Frank"], // Added mock participant names
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
    participantNames: ["You"], // Added mock participant names
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
    participantNames: ["You", "Grace"], // Added mock participant names
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
    participantNames: ["You", "Heidi", "Ivan", "Judy"], // Added mock participant names
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

// NEW: Mock profiles for demonstration
const mockProfiles: Profile[] = [
  {
    id: "mock-user-id-1",
    first_name: "Alice",
    last_name: "Smith",
    avatar_url: null,
    bio: "Passionate about AI and machine learning. Always looking for new challenges.",
    intention: "Working on a new neural network architecture for image recognition.",
    sociability: 80,
    updated_at: new Date().toISOString(),
    organization: "Tech Innovators Inc.",
    linkedin_url: "https://www.linkedin.com/in/alicesmith",
    host_code: "redfox",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-2",
    first_name: "Bob",
    last_name: "Johnson",
    avatar_url: null,
    bio: "Frontend developer with a love for clean UI/UX. React enthusiast.",
    intention: "Refactoring legacy code and implementing new design system components.",
    sociability: 60,
    updated_at: new Date().toISOString(),
    organization: "Web Solutions Co.",
    linkedin_url: "https://www.linkedin.com/in/bobjohnson",
    host_code: "bluebear",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-3",
    first_name: "Charlie",
    last_name: "Brown",
    avatar_url: null,
    bio: "Backend engineer specializing in scalable microservices and cloud infrastructure.",
    intention: "Optimizing database queries and deploying new serverless functions.",
    sociability: 40,
    updated_at: new Date().toISOString(),
    organization: "Cloud Builders LLC",
    linkedin_url: "https://www.linkedin.com/in/charliebrown",
    host_code: "greencat",
    bio_visibility: ['friends', 'organisation'], // NEW
    intention_visibility: ['friends', 'organisation'], // NEW
    linkedin_visibility: ['friends', 'organisation'], // NEW
  },
  {
    id: "mock-user-id-4",
    first_name: "Diana",
    last_name: "Prince",
    avatar_url: null,
    bio: "Project manager focused on agile methodologies and team leadership.",
    intention: "Coordinating cross-functional teams for the upcoming product launch.",
    sociability: 90,
    updated_at: new Date().toISOString(),
    organization: "Global Enterprises",
    linkedin_url: "https://www.linkedin.com/in/dianaprince",
    host_code: "yellowdog",
    bio_visibility: ['public', 'organisation'], // NEW
    intention_visibility: ['public', 'organisation'], // NEW
    linkedin_visibility: ['public', 'organisation'], // NEW
  },
  {
    id: "mock-user-id-5",
    first_name: "Eve",
    last_name: "Adams",
    avatar_url: null,
    bio: "UX Researcher passionate about user-centered design and usability testing.",
    intention: "Conducting user interviews and analyzing feedback for product improvements.",
    sociability: 70,
    updated_at: new Date().toISOString(),
    organization: "Design Innovations",
    linkedin_url: "https://www.linkedin.com/in/eveadams",
    host_code: "purplelion",
    bio_visibility: ['private'], // NEW
    intention_visibility: ['private'], // NEW
    linkedin_visibility: ['private'], // NEW
  },
  {
    id: "mock-user-id-6",
    first_name: "Frank",
    last_name: "White",
    avatar_url: null,
    bio: "Data Scientist building predictive models and analyzing large datasets.",
    intention: "Developing a new recommendation engine for the e-commerce platform.",
    sociability: 30,
    updated_at: new Date().toISOString(),
    organization: "Data Insights Co.",
    linkedin_url: "https://www.linkedin.com/in/frankwhite",
    host_code: "orangetiger",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-7",
    first_name: "Grace",
    last_name: "Taylor",
    avatar_url: null,
    bio: "Content creator and digital marketer. Specializing in SEO and social media strategy.",
    intention: "Planning content calendar for Q4 and optimizing website for search engines.",
    sociability: 85,
    updated_at: new Date().toISOString(),
    organization: "Creative Minds Agency",
    linkedin_url: "https://www.linkedin.com/in/gracetaylor",
    host_code: "pinkwolf",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-8",
    first_name: "Heidi",
    last_name: "Clark",
    avatar_url: null,
    bio: "Cybersecurity analyst protecting digital assets and ensuring data privacy.",
    intention: "Performing penetration testing and implementing new security protocols.",
    sociability: 55,
    updated_at: new Date().toISOString(),
    organization: "Secure Solutions Ltd.",
    linkedin_url: "https://www.linkedin.com/in/heidiclark",
    host_code: "browndeer",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-9",
    first_name: "Ivan",
    last_name: "King",
    avatar_url: null,
    bio: "DevOps engineer automating deployment pipelines and managing cloud infrastructure.",
    intention: "Setting up CI/CD for a new microservice and monitoring system performance.",
    sociability: 45,
    updated_at: new Date().toISOString(),
    organization: "Automate Everything Inc.",
    linkedin_url: "https://www.linkedin.com/in/ivanking",
    host_code: "greyzebra",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
  {
    id: "mock-user-id-10",
    first_name: "Judy",
    last_name: "Lee",
    avatar_url: null,
    bio: "Product designer crafting intuitive and engaging user experiences.",
    intention: "Designing wireframes and prototypes for the next product iteration.",
    sociability: 75,
    updated_at: new Date().toISOString(),
    organization: "Innovate UX",
    linkedin_url: "https://www.linkedin.com/in/judylee",
    host_code: "blackpanda",
    bio_visibility: ['public'], // NEW
    intention_visibility: ['public'], // NEW
    linkedin_visibility: ['public'], // NEW
  },
];


interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate, successMessage?: string) => Promise<void>; // MODIFIED: Added successMessage
  fetchProfile: () => Promise<void>;
  
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;

  sessions: SessionHistory[];
  setSessions: React.Dispatch<React.SetStateAction<SessionHistory[]>>;
  statsData: StatsData;

  historyTimePeriod: TimePeriod;
  setHistoryTimePeriod: React.Dispatch<React.SetStateAction<TimePeriod>>;
  // Removed leaderboardFocusTimePeriod and leaderboardCollaborationTimePeriod
  // Leaderboard will now directly use historyTimePeriod

  saveSession: (
    seshTitle: string,
    notes: string,
    finalAccumulatedFocusSeconds: number,
    finalAccumulatedBreakSeconds: number,
    totalSessionSeconds: number,
    activeJoinedSessionCoworkerCount: number,
    sessionStartTime: number,
    activeAsks: ActiveAskItem[] | undefined,
    allParticipantNames: string[] | undefined // NEW: Added allParticipantNames
  ) => Promise<void>;

  blockedUsers: string[];
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  recentCoworkers: string[];

  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;

  deleteSession: (sessionId: string) => Promise<void>;
  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>; // NEW: Added getPublicProfile

  // NEW: Per-field visibility states
  bioVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setBioVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  intentionVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setIntentionVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  linkedinVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setLinkedinVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
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
const LOCAL_STORAGE_BIO_VISIBILITY_KEY = 'deepsesh_bio_visibility'; // NEW
const LOCAL_STORAGE_INTENTION_VISIBILITY_KEY = 'deepsesh_intention_visibility'; // NEW
const LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY = 'deepsesh_linkedin_visibility'; // NEW

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localFirstName, setLocalFirstName] = useState("You");

  const [sessions, setSessions] = useState<SessionHistory[]>(initialSessions);
  
  const statsData = useMemo(() => calculateStats(sessions, user?.id, localFirstName), [sessions, user?.id, localFirstName]);

  const [historyTimePeriod, setHistoryTimePeriod] = useState<TimePeriod>('week');
  // Removed leaderboardFocusTimePeriod and leaderboardCollaborationTimePeriod states

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [hostCode, setHostCode] = useState("");

  // NEW: Per-field visibility states
  const [bioVisibility, setBioVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);

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

    // NEW: Load per-field visibility from local storage for unauthenticated users
    const storedBioVisibility = localStorage.getItem(LOCAL_STORAGE_BIO_VISIBILITY_KEY);
    if (storedBioVisibility) setBioVisibility(JSON.parse(storedBioVisibility));
    const storedIntentionVisibility = localStorage.getItem(LOCAL_STORAGE_INTENTION_VISIBILITY_KEY);
    if (storedIntentionVisibility) setIntentionVisibility(JSON.parse(storedIntentionVisibility));
    const storedLinkedinVisibility = localStorage.getItem(LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY);
    if (storedLinkedinVisibility) setLinkedinVisibility(JSON.parse(storedLinkedinVisibility));


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
      // NEW: Set per-field visibility from fetched profile
      setBioVisibility((existingProfile.bio_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
      setIntentionVisibility((existingProfile.intention_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
      setLinkedinVisibility((existingProfile.linkedin_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);

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
          host_code: newHostCode,
          bio_visibility: ['public'], // NEW: Default visibility on creation
          intention_visibility: ['public'], // NEW
          linkedin_visibility: ['public'], // NEW
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
        // NEW: Set per-field visibility from new profile
        setBioVisibility((newProfile.bio_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
        setIntentionVisibility((newProfile.intention_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
        setLinkedinVisibility((newProfile.linkedin_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
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
            participantNames: localSesh.participantNames, // NEW: Preserve local participant names
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
            participantNames: undefined, // Supabase doesn't store this, so it's undefined
          });
        }
      });

      mergedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSessions(mergedSessions);
      console.log("ProfileContext: Sessions fetched and merged:", mergedSessions);
    }
    setLoading(false);
  };

  const updateProfile = async (data: ProfileUpdate, successMessage?: string) => { // MODIFIED: Added successMessage
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
      // NEW: Update per-field visibility states after successful update
      setBioVisibility((updatedData.bio_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
      setIntentionVisibility((updatedData.intention_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);
      setLinkedinVisibility((updatedData.linkedin_visibility || ['public']) as ('public' | 'friends' | 'organisation' | 'private')[]);

      console.log("Profile updated in Supabase and context:", { ...updatedData, first_name: updatedData.first_name || "" });
      toast.success(successMessage || "Profile updated!", { // MODIFIED: Use successMessage or fallback
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
    activeAsks: ActiveAskItem[] | undefined,
    allParticipantNames: string[] | undefined // NEW: Added allParticipantNames
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
      participantNames: allParticipantNames, // NEW: Store participant names
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

  // NEW: Function to get a public profile by ID or name
  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => {
    // First, try to find in mock profiles
    const mockProfile = mockProfiles.find(p => p.id === userId || p.first_name === userName);
    if (mockProfile) {
      return mockProfile;
    }

    // If not in mock profiles, try to fetch from Supabase (if user is authenticated)
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching public profile from Supabase:", error);
        throw new Error("Failed to fetch profile.");
      }
      if (data) {
        return { ...data, first_name: data.first_name || "" };
      }
    }
    
    // Fallback for unknown users (e.g., if only name is available and not in mocks/DB)
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      bio: null,
      intention: null,
      sociability: 50, // Default sociability
      updated_at: new Date().toISOString(),
      organization: null,
      linkedin_url: null,
      host_code: null,
      bio_visibility: ['public'], // NEW: Default visibility for unknown users
      intention_visibility: ['public'], // NEW
      linkedin_visibility: ['public'], // NEW
    };
  }, []);


  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      setProfile(data.profile ?? null);
      console.log("Profile loaded from local storage:", data.profile?.first_name);
      setHistoryTimePeriod(data.historyTimePeriod ?? 'week');
      // Removed leaderboardFocusTimePeriod and leaderboardCollaborationTimePeriod
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
        // NEW: Reset per-field visibility to default for unauthenticated users
        setBioVisibility(['public']);
        setIntentionVisibility(['public']);
        setLinkedinVisibility(['public']);
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
      // Removed leaderboardFocusTimePeriod and leaderboardCollaborationTimePeriod from dataToSave
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("Profile saved to local storage:", profile?.first_name);
  }, [
    profile,
    historyTimePeriod,
    // Removed leaderboardFocusTimePeriod, leaderboardCollaborationTimePeriod from dependencies
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

  // NEW: Save per-field visibility to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BIO_VISIBILITY_KEY, JSON.stringify(bioVisibility));
  }, [bioVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_INTENTION_VISIBILITY_KEY, JSON.stringify(intentionVisibility));
  }, [intentionVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY, JSON.stringify(linkedinVisibility));
  }, [linkedinVisibility]);

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
    // Removed leaderboardFocusTimePeriod and leaderboardCollaborationTimePeriod from value
    saveSession,
    blockedUsers,
    blockUser,
    unblockUser,
    recentCoworkers,
    hostCode,
    setHostCode,
    deleteSession,
    getPublicProfile, // NEW: Expose getPublicProfile
    bioVisibility, // NEW
    setBioVisibility, // NEW
    intentionVisibility, // NEW
    setIntentionVisibility, // NEW
    linkedinVisibility, // NEW
    setLinkedinVisibility, // NEW
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};