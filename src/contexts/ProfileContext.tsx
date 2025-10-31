import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { Poll, ActiveAskItem, ExtendSuggestion } from "@/types/timer";
import { useAuth } from "./AuthContext";

// Define a simplified Profile type for local storage
export type Profile = {
  avatar_url: string | null
  bio: string | null
  first_name: string | null
  id: string
  intention: string | null
  last_name: string | null
  linkedin_url: string | null
  organization: string | null
  sociability: number | null
  updated_at: string | null
  host_code: string | null
  bio_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  intention_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  linkedin_visibility: ("public" | "friends" | "organisation" | "private")[] | null
};

// Simplified ProfileUpdate type for local storage
export type ProfileUpdate = Partial<Omit<Profile, 'id'>>;

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
  participantNames?: string[];
}

export interface StatsPeriodData {
  totalFocusTime: string;
  sessionsCompleted: number;
  coworkers: number;
  focusRank: string;
  coworkerRank: string;
}

export interface StatsData {
  week: StatsPeriodData;
  month: StatsPeriodData;
  all: StatsPeriodData;
}

const formatSecondsToDurationString = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} mins`;
};

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
  const matchMinsOnly = durationString.match(/(\d+)\s*mins/);
  if (!matchHours && !matchMinutes && matchMinsOnly) {
    totalSeconds += parseInt(matchMinsOnly[1], 10) * 60;
  }
  return totalSeconds;
};

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

const isDateInCurrentWeek = (sessionDate: Date, today: Date): boolean => {
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(today.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
};

const isDateInCurrentMonth = (sessionDate: Date, today: Date): boolean => {
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
};

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

    const focusLeaderboard = [...dummyLeaderboardFocusHours[period]];
    const existingUserFocusIndex = focusLeaderboard.findIndex(user => user.id === currentUserId);
    if (existingUserFocusIndex !== -1) {
      focusLeaderboard[existingUserFocusIndex] = { id: currentUserId || "mock-user", name: currentUserName, focusHours: userFocusHours };
    } else {
      focusLeaderboard.push({ id: currentUserId || "mock-user", name: currentUserName, focusHours: userFocusHours });
    }
    focusLeaderboard.sort((a, b) => b.focusHours - a.focusHours);
    const userFocusRank = focusLeaderboard.findIndex(user => user.id === currentUserId) + 1;

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

const currentYear = new Date().getFullYear();

const initialSessions: SessionHistory[] = [
  {
    id: crypto.randomUUID(),
    title: "Deep Work Sprint",
    date: new Date(`${currentYear}-09-15T09:00:00Z`).toISOString(),
    duration: "45 mins",
    participants: 3,
    type: "focus",
    notes: "Great session focusing on project documentation. Made significant progress on the API specs.",
    asks: [],
    session_start_time: new Date(`${currentYear}-09-15T09:00:00Z`).toISOString(),
    session_end_time: new Date(`${currentYear}-09-15T09:45:00Z`).toISOString(),
    participantNames: ["You", "Alice", "Bob"],
  },
  {
    id: crypto.randomUUID(),
    title: "Study Group Alpha",
    date: new Date(`${currentYear}-09-14T10:30:00Z`).toISOString(),
    duration: "90 mins",
    participants: 5,
    type: "focus",
    notes: "Collaborative study session for the upcoming presentation. Everyone stayed focused and productive.",
    asks: [],
    session_start_time: new Date(`${currentYear}-09-14T10:30:00Z`).toISOString(),
    session_end_time: new Date(`${currentYear}-09-14T12:00:00Z`).toISOString(),
    participantNames: ["You", "Charlie", "Diana", "Eve", "Frank"],
  },
  {
    id: crypto.randomUUID(),
    title: "Solo Focus",
    date: new Date(`${currentYear}-09-13T14:00:00Z`).toISOString(),
    duration: "30 mins",
    participants: 1,
    type: "focus",
    notes: "Quick focused session to review quarterly goals and plan next steps.",
    asks: [],
    session_start_time: new Date(`${currentYear}-09-13T14:00:00Z`).toISOString(),
    session_end_time: new Date(`${currentYear}-09-13T14:30:00Z`).toISOString(),
    participantNames: ["You"],
  },
  {
    id: crypto.randomUUID(),
    title: "Coding Session",
    date: new Date(`${currentYear}-09-12T11:00:00Z`).toISOString(),
    duration: "120 mins",
    participants: 2,
    type: "focus",
    notes: "Pair programming session working on the new user interface components. Fixed several bugs.",
    asks: [],
    session_start_time: new Date(`${currentYear}-09-12T11:00:00Z`).toISOString(),
    session_end_time: new Date(`${currentYear}-09-12T13:00:00Z`).toISOString(),
    participantNames: ["You", "Grace"],
  },
  {
    id: crypto.randomUUID(),
    title: "Research Deep Dive",
    date: new Date(`${currentYear}-09-11T16:00:00Z`).toISOString(),
    duration: "60 mins",
    participants: 4,
    type: "focus",
    notes: "Market research session for the new product launch. Gathered valuable competitive intelligence.",
    asks: [],
    session_start_time: new Date(`${currentYear}-09-11T16:00:00Z`).toISOString(),
    session_end_time: new Date(`${currentYear}-09-11T17:00:00Z`).toISOString(),
    participantNames: ["You", "Heidi", "Ivan", "Judy"],
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "redfox",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "bluebear",
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
    bio_visibility: ['friends', 'organisation'],
    intention_visibility: ['friends', 'organisation'],
    linkedin_visibility: ['friends', 'organisation'],
    host_code: "greencat",
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
    bio_visibility: ['public', 'organisation'],
    intention_visibility: ['public', 'organisation'],
    linkedin_visibility: ['public', 'organisation'],
    host_code: "yellowdog",
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
    bio_visibility: ['private'],
    intention_visibility: ['private'],
    linkedin_visibility: ['private'],
    host_code: "purplelion",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "orangetiger",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "pinkwolf",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "browndeer",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "greyzebra",
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
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    host_code: "blackpanda",
  },
];


interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdate, successMessage?: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  
  localFirstName: string;
  setLocalFirstName: React.Dispatch<React.SetStateAction<string>>;

  blockedUsers: string[];
  blockUser: (userName: string) => void;
  unblockUser: (userName: string) => void;
  recentCoworkers: string[];

  hostCode: string;
  setHostCode: React.Dispatch<React.SetStateAction<string>>;

  getPublicProfile: (userId: string, userName: string) => Promise<Profile | null>;

  bioVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setBioVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  intentionVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setIntentionVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  linkedinVisibility: ('public' | 'friends' | 'organisation' | 'private')[];
  setLinkedinVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;

  friendStatuses: Record<string, 'none' | 'pending' | 'friends'>;
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (targetUserId: string) => void;
  removeFriend: (targetUserId: string) => void;
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
const LOCAL_STORAGE_BIO_VISIBILITY_KEY = 'deepsesh_bio_visibility';
const LOCAL_STORAGE_INTENTION_VISIBILITY_KEY = 'deepsesh_intention_visibility';
const LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY = 'deepsesh_linkedin_visibility';
const LOCAL_STORAGE_FRIEND_STATUSES_KEY = 'deepsesh_friend_statuses';
const LOCAL_STORAGE_ORGANIZATION_KEY = 'deepsesh_organization'; // NEW: Local storage key for organization

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const { user, login } = useAuth(); // Added login from AuthContext
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localFirstName, setLocalFirstName] = useState("You");

  const statsData = useMemo(() => ({
    week: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    month: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
    all: { totalFocusTime: "0h 0m", sessionsCompleted: 0, coworkers: 0, focusRank: "N/A", coworkerRank: "N/A" },
  }), []);

  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [hostCode, setHostCode] = useState("");

  const [bioVisibility, setBioVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [intentionVisibility, setIntentionVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);
  const [linkedinVisibility, setLinkedinVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(['public']);

  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'friends'>>({});
  const friendRequestTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

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
  }, []);

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
  }, [blockedUsers]);

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
  }, [blockedUsers]);

  const sendFriendRequest = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'pending' }));
    toast.success("Friend request sent!", {
      description: "They will be notified of your request.",
    });

    const timeoutId = setTimeout(() => {
      setFriendStatuses(prev => {
        if (prev[targetUserId] === 'pending') {
          toast.success(`Friend request from ${targetUserId} accepted!`, {
            description: "You are now friends!",
          });
          return { ...prev, [targetUserId]: 'friends' };
        }
        return prev;
      });
      friendRequestTimeouts.current.delete(targetUserId);
    }, 3000);

    friendRequestTimeouts.current.set(targetUserId, timeoutId);
  }, []);

  const acceptFriendRequest = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'friends' }));
    toast.success("Friend request accepted!", {
      description: "You are now friends!",
    });
    if (friendRequestTimeouts.current.has(targetUserId)) {
      clearTimeout(friendRequestTimeouts.current.get(targetUserId)!);
      friendRequestTimeouts.current.delete(targetUserId);
    }
  }, []);

  const removeFriend = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'none' }));
    toast.info("Friend removed.", {
      description: "You are no longer friends.",
    });
    if (friendRequestTimeouts.current.has(targetUserId)) {
      clearTimeout(friendRequestTimeouts.current.get(targetUserId)!);
      friendRequestTimeouts.current.delete(targetUserId);
    }
  }, []);


  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    const storedBioVisibility = localStorage.getItem(LOCAL_STORAGE_BIO_VISIBILITY_KEY);
    if (storedBioVisibility) setBioVisibility(JSON.parse(storedBioVisibility));
    const storedIntentionVisibility = localStorage.getItem(LOCAL_STORAGE_INTENTION_VISIBILITY_KEY);
    if (storedIntentionVisibility) setIntentionVisibility(JSON.parse(storedIntentionVisibility));
    const storedLinkedinVisibility = localStorage.getItem(LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY);
    if (storedLinkedinVisibility) setLinkedinVisibility(JSON.parse(storedLinkedinVisibility));

    const storedFriendStatuses = localStorage.getItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY);
    if (storedFriendStatuses) setFriendStatuses(JSON.parse(storedFriendStatuses));

    const storedHostCode = localStorage.getItem(LOCAL_STORAGE_HOST_CODE_KEY);
    const storedOrganization = localStorage.getItem(LOCAL_STORAGE_ORGANIZATION_KEY); // NEW: Load organization

    let currentProfile: Profile | null = null;

    if (user) {
      // If a user is "logged in" locally, create a profile for them
      currentProfile = {
        id: user.id,
        first_name: user.user_metadata.first_name || user.email.split('@')[0],
        last_name: user.user_metadata.last_name || null,
        avatar_url: null,
        bio: localStorage.getItem('deepsesh_bio') || null,
        intention: localStorage.getItem('deepsesh_intention') || null,
        sociability: parseInt(localStorage.getItem('deepsesh_sociability') || '50', 10),
        organization: storedOrganization || null, // Use loaded organization
        linkedin_url: localStorage.getItem('deepsesh_linkedin_url') || null,
        updated_at: new Date().toISOString(),
        host_code: storedHostCode || generateRandomHostCode(),
        bio_visibility: (storedBioVisibility ? JSON.parse(storedBioVisibility) : ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        intention_visibility: (storedIntentionVisibility ? JSON.parse(storedIntentionVisibility) : ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
        linkedin_visibility: (storedLinkedinVisibility ? JSON.parse(storedLinkedinVisibility) : ['public']) as ('public' | 'friends' | 'organisation' | 'private')[],
      };
      setProfile(currentProfile);
      setHostCode(currentProfile.host_code || generateRandomHostCode());
      setBioVisibility(currentProfile.bio_visibility || ['public']);
      setIntentionVisibility(currentProfile.intention_visibility || ['public']);
      setLinkedinVisibility(currentProfile.linkedin_visibility || ['public']);
      console.log("Profile fetched from local storage for logged-in user:", currentProfile.first_name);
    } else {
      setProfile(null);
      setHostCode(storedHostCode || generateRandomHostCode());
      console.log("No user logged in, using default/local host code.");
    }
    setLoading(false);
  };

  const updateProfile = async (data: ProfileUpdate, successMessage?: string) => {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not authenticated locally.");
      setLoading(false);
      toast.error("Authentication required", {
        description: "Please log in to update your profile.",
      });
      return;
    }

    // Update local storage for each field
    if (data.first_name !== undefined) localStorage.setItem('deepsesh_local_first_name', data.first_name);
    if (data.bio !== undefined) localStorage.setItem('deepsesh_bio', data.bio || '');
    if (data.intention !== undefined) localStorage.setItem('deepsesh_intention', data.intention || '');
    if (data.sociability !== undefined) localStorage.setItem('deepsesh_sociability', String(data.sociability));
    if (data.organization !== undefined) localStorage.setItem(LOCAL_STORAGE_ORGANIZATION_KEY, data.organization || ''); // NEW: Save organization
    if (data.linkedin_url !== undefined) localStorage.setItem('deepsesh_linkedin_url', data.linkedin_url || '');
    if (data.host_code !== undefined) localStorage.setItem(LOCAL_STORAGE_HOST_CODE_KEY, data.host_code);
    if (data.bio_visibility !== undefined) localStorage.setItem(LOCAL_STORAGE_BIO_VISIBILITY_KEY, JSON.stringify(data.bio_visibility));
    if (data.intention_visibility !== undefined) localStorage.setItem(LOCAL_STORAGE_INTENTION_VISIBILITY_KEY, JSON.stringify(data.intention_visibility));
    if (data.linkedin_visibility !== undefined) localStorage.setItem(LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY, JSON.stringify(data.linkedin_visibility));

    // Update the local profile state
    setProfile(prevProfile => {
      if (!prevProfile) return null;
      const updatedProfile = {
        ...prevProfile,
        ...data,
        updated_at: new Date().toISOString(),
      };
      return updatedProfile;
    });

    if (data.host_code) {
      setHostCode(data.host_code);
    }
    if (data.bio_visibility) setBioVisibility(data.bio_visibility);
    if (data.intention_visibility) setIntentionVisibility(data.intention_visibility);
    if (data.linkedin_visibility) setLinkedinVisibility(data.linkedin_visibility);

    console.log("Profile updated in local storage and context:", data);
    toast.success(successMessage || "Profile updated!", {
      description: "Your profile has been successfully saved locally.",
    });
    setLoading(false);
  };

  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => {
    const mockProfile = mockProfiles.find(p => p.id === userId || p.first_name === userName);
    if (mockProfile) {
      return mockProfile;
    }
    
    // For non-logged-in users or mock users, return a basic profile
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      bio: null,
      intention: null,
      sociability: 50,
      updated_at: new Date().toISOString(),
      organization: null,
      linkedin_url: null,
      host_code: null,
      bio_visibility: ['public'],
      intention_visibility: ['public'],
      linkedin_visibility: ['public'],
    };
  }, []);


  useEffect(() => {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const data = JSON.parse(storedData);
      setProfile(data.profile ?? null);
      console.log("Profile loaded from local storage:", data.profile?.first_name);
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
    
    // Listen for local user changes
    const handleUserChange = () => {
      fetchProfile();
    };
    window.addEventListener('storage', handleUserChange); // Listen for changes in other tabs

    return () => {
      window.removeEventListener('storage', handleUserChange);
      friendRequestTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      friendRequestTimeouts.current.clear();
    };
  }, [user]); // Depend on user from AuthContext

  useEffect(() => {
    const dataToSave = {
      profile,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    console.log("Profile saved to local storage:", profile?.first_name);
  }, [
    profile,
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

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BIO_VISIBILITY_KEY, JSON.stringify(bioVisibility));
  }, [bioVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_INTENTION_VISIBILITY_KEY, JSON.stringify(intentionVisibility));
  }, [intentionVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_LINKEDIN_VISIBILITY_KEY, JSON.stringify(linkedinVisibility));
  }, [linkedinVisibility]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY, JSON.stringify(friendStatuses));
  }, [friendStatuses]);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    fetchProfile,
    localFirstName,
    setLocalFirstName,
    blockedUsers,
    blockUser,
    unblockUser,
    recentCoworkers,
    hostCode,
    setHostCode,
    getPublicProfile,
    bioVisibility,
    setBioVisibility,
    intentionVisibility,
    setIntentionVisibility,
    linkedinVisibility,
    setLinkedinVisibility,
    friendStatuses,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};