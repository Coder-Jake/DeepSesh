import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from "react";
import { toast } from 'sonner';
import { Poll, ActiveAskItem, ExtendSuggestion } from "@/types/timer";
import { useAuth } from "./AuthContext";
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
import { useTimer } from "./TimerContext"; // NEW: Import useTimer

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
  focus_preference: number | null
  updated_at: string | null
  host_code: string | null
  bio_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  intention_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  linkedin_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  can_help_with: string | null
  can_help_with_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  need_help_with: string | null
  need_help_with_visibility: ("public" | "friends" | "organisation" | "private")[] | null
  pronouns: string | null;
};

// Simplified ProfileUpdate type for local storage
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'updated_at'>>;

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
  session_end_time: string;
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
  // NEW: Mock profiles for participants in mockNearbySessions
  {
    id: "mock-user-id-bezos",
    first_name: "Sam Altman",
    last_name: null,
    avatar_url: null,
    bio: "Leading AI research and development for beneficial general intelligence.",
    intention: "Focusing on safe and broadly distributed AGI.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "OpenAI",
    linkedin_url: "https://www.linkedin.com/in/samaltman",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "AI strategy, Startup scaling, Venture capital",
    can_help_with_visibility: ['public'],
    need_help_with: "AI safety research, Regulatory frameworks for AGI",
    need_help_with_visibility: ['private'],
    host_code: "goldfish",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-musk",
    first_name: "Musk",
    last_name: null,
    avatar_url: null,
    bio: "Designing reusable rocket components and electric vehicles.",
    intention: "Innovating space travel and sustainable energy.",
    focus_preference: 10,
    updated_at: new Date().toISOString(),
    organization: "SpaceX",
    linkedin_url: "https://www.linkedin.com/in/elonmusk",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Rocket engineering, EV design, AI ethics",
    can_help_with_visibility: ['public'],
    need_help_with: "Neuralink research, Mars colonization logistics",
    need_help_with_visibility: ['private'],
    host_code: "silverfalcon",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-zuckerberg",
    first_name: "Zuckerberg",
    last_name: null,
    avatar_url: null,
    bio: "Developing new social algorithms and metaverse experiences.",
    intention: "Connecting the world through virtual reality.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "Meta",
    linkedin_url: "https://www.linkedin.com/in/zuck",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social network architecture, VR/AR development",
    can_help_with_visibility: ['public'],
    need_help_with: "Privacy regulations, Content moderation strategies",
    need_help_with_visibility: ['private'],
    host_code: "bronzeowl",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-gates",
    first_name: "Daniela Amodei",
    last_name: null,
    avatar_url: null,
    bio: "Co-founder of Anthropic, focusing on AI safety and responsible development.",
    intention: "Building reliable, interpretable, and steerable AI systems.",
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "Anthropic",
    linkedin_url: "https://www.linkedin.com/in/daniela-amodei-0b1b3b1b",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "AI ethics, Machine learning research, Startup leadership",
    can_help_with_visibility: ['public'],
    need_help_with: "Large-scale AI model training, Human-AI collaboration",
    need_help_with_visibility: ['private'],
    host_code: "indigoduck",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-jobs",
    first_name: "Jensen Huang",
    last_name: null,
    avatar_url: null,
    bio: "CEO of NVIDIA, pioneering accelerated computing and AI.",
    intention: "Driving innovation in graphics processing and artificial intelligence.",
    focus_preference: 30,
    updated_at: new Date().toISOString(),
    organization: "NVIDIA",
    linkedin_url: "https://www.linkedin.com/in/jensenhuang",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "GPU technology, AI hardware, Semiconductor industry",
    can_help_with_visibility: ['public'],
    need_help_with: "Quantum computing integration, Advanced robotics",
    need_help_with_visibility: ['private'],
    host_code: "violetswan",
    pronouns: "He/Him",
  },
  // NEW: Mock profiles for participants in mockFriendsSessions
  {
    id: "mock-user-id-freud",
    first_name: "Freud",
    last_name: null,
    avatar_url: null,
    bio: "Reviewing psychoanalytic theories and the unconscious mind.",
    intention: "Unraveling the complexities of human behavior.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Psychology Dept.",
    linkedin_url: "https://www.linkedin.com/in/sigmundfreud",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Psychoanalysis, Dream interpretation",
    can_help_with_visibility: ['friends'],
    need_help_with: "Modern neuroscience, Cognitive psychology",
    need_help_with_visibility: ['friends'],
    host_code: "tealshark",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-skinner",
    first_name: "Skinner",
    last_name: null,
    avatar_url: null,
    bio: "Memorizing behavioral principles and operant conditioning.",
    intention: "Understanding learned responses and reinforcement.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Behavioral Science Institute",
    linkedin_url: "https://www.linkedin.com/in/bfskinner",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Behavioral analysis, Operant conditioning",
    can_help_with_visibility: ['friends'],
    need_help_with: "Humanistic psychology, Free will debates",
    need_help_with_visibility: ['friends'],
    host_code: "cyanwhale",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-piaget",
    first_name: "Piaget",
    last_name: null,
    avatar_url: null,
    bio: "Practicing cognitive development questions and child psychology.",
    intention: "Exploring the stages of intellectual growth.",
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    organization: "Child Development Center",
    linkedin_url: "https://www.linkedin.com/in/jeanpiaget",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Child development, Cognitive stages",
    can_help_with_visibility: ['friends'],
    need_help_with: "Adolescent psychology, Educational technology",
    need_help_with_visibility: ['friends'],
    host_code: "magentadolphin",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-jung",
    first_name: "Jung",
    last_name: null,
    avatar_url: null,
    bio: "Summarizing archetypal concepts and analytical psychology.",
    intention: "Delving into the collective unconscious.",
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Analytical Psychology Group",
    linkedin_url: "https://www.linkedin.com/in/carljung",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Archetypes, Collective unconscious, Dream analysis",
    can_help_with_visibility: ['friends'],
    need_help_with: "Behavioral economics, Social psychology",
    need_help_with_visibility: ['friends'],
    host_code: "limeoctopus",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-maslow",
    first_name: "Maslow",
    last_name: null,
    avatar_url: null,
    bio: "Creating hierarchy of needs flashcards and humanistic psychology.",
    intention: "Promoting self-actualization and personal growth.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Human Potential Institute",
    linkedin_url: "https://www.linkedin.com/in/abrahammaslow",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Hierarchy of needs, Self-actualization",
    can_help_with_visibility: ['friends'],
    need_help_with: "Positive psychology interventions, Organizational behavior",
    need_help_with_visibility: ['friends'],
    host_code: "marooncrab",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-rogers",
    first_name: "Rogers",
    last_name: null,
    avatar_url: null,
    bio: "Discussing humanistic approaches and client-centered therapy.",
    intention: "Fostering empathy and unconditional positive regard.",
    focus_preference: 55,
    updated_at: new Date().toISOString(),
    organization: "Person-Centered Therapy Clinic",
    linkedin_url: "https://www.linkedin.com/in/carlrogers",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Client-centered therapy, Empathy training",
    can_help_with_visibility: ['friends'],
    need_help_with: "Group therapy dynamics, Cross-cultural counseling",
    need_help_with_visibility: ['friends'],
    host_code: "navysquid",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-bandura",
    first_name: "Bandura",
    last_name: null,
    avatar_url: null,
    bio: "Collaborating on social learning theory guide and observational learning.",
    intention: "Exploring the power of modeling and self-efficacy.",
    focus_preference: 65,
    updated_at: new Date().toISOString(),
    organization: "Social Cognitive Research",
    linkedin_url: "https://www.linkedin.com/in/albertbandura",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social learning theory, Self-efficacy",
    can_help_with_visibility: ['friends'],
    need_help_with: "Cognitive neuroscience, Developmental psychology",
    need_help_with_visibility: ['friends'],
    host_code: "olivejellyfish",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pavlov",
    first_name: "Pavlov",
    last_name: null,
    avatar_url: null,
    bio: "Peer teaching classical conditioning and behavioral responses.",
    intention: "Investigating conditioned reflexes.",
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    organization: "Physiology Lab",
    linkedin_url: "https://www.linkedin.com/in/ivanpavlov",
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Classical conditioning, Reflexology",
    can_help_with_visibility: ['friends'],
    need_help_with: "Neurophysiology, Animal behavior studies",
    need_help_with_visibility: ['friends'],
    host_code: "aquastarfish",
    pronouns: "He/Him",
  },
  // NEW: Mock profiles for organization members (famous philosophers/scientists)
  {
    id: "mock-user-id-aristotle",
    first_name: "Aristotle",
    last_name: null,
    avatar_url: null,
    bio: "Studying logic, metaphysics, ethics, and politics.",
    intention: "Deep work on Aristotle's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Logic, Ethics, Political theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern science, Empirical research methods",
    need_help_with_visibility: ['organisation'],
    host_code: "redphilosopher",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-plato",
    first_name: "Plato",
    last_name: null,
    avatar_url: null,
    bio: "Exploring the theory of Forms and ideal states.",
    intention: "Deep work on Plato's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Metaphysics, Epistemology, Political philosophy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Practical applications, Democratic theory",
    need_help_with_visibility: ['organisation'],
    host_code: "bluephilosopher",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-socrates",
    first_name: "Socrates",
    last_name: null,
    avatar_url: null,
    bio: "Engaging in dialectic and ethical inquiry.",
    intention: "Deep work on Socrates' theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Socratic method, Ethical reasoning",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Formal logic, Scientific method",
    need_help_with_visibility: ['organisation'],
    host_code: "greensocrates",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-descartes",
    first_name: "Descartes",
    last_name: null,
    avatar_url: null,
    bio: "Meditating on first philosophy and rationalism.",
    intention: "Deep work on Descartes' theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Rationalist Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Rationalism, Metaphysics, Analytic geometry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Empiricism, Modern physics",
    need_help_with_visibility: ['organisation'],
    host_code: "yellowdescartes",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-kant",
    first_name: "Kant",
    last_name: null,
    avatar_url: null,
    bio: "Developing critical philosophy and transcendental idealism.",
    intention: "Deep work on Kant's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Critical Philosophy Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Categorical imperative, Epistemology",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Post-Kantian philosophy, Existentialism",
    need_help_with_visibility: ['organisation'],
    host_code: "purplekant",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-locke",
    first_name: "Locke",
    last_name: null,
    avatar_url: null,
    bio: "Advocating for empiricism and natural rights.",
    intention: "Deep work on Locke's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Empiricist Collective",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Empiricism, Political philosophy, Natural rights",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Rationalism, Modern constitutional law",
    need_help_with_visibility: ['organisation'],
    host_code: "orangelocke",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hume",
    first_name: "Hume",
    last_name: null,
    avatar_url: null,
    bio: "Questioning causality and human understanding.",
    intention: "Deep work on Hume's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Skeptical Inquiry Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Skepticism, Empiricism, Philosophy of mind",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Moral philosophy, Metaphysics",
    need_help_with_visibility: ['organisation'],
    host_code: "pinkhume",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-rousseau",
    first_name: "Rousseau",
    last_name: null,
    avatar_url: null,
    bio: "Contemplating the social contract and human nature.",
    intention: "Deep work on Rousseau's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Social Contract Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Social contract theory, Education philosophy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern political science, Environmental ethics",
    need_help_with_visibility: ['organisation'],
    host_code: "brownrousseau",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-newton",
    first_name: "Newton",
    last_name: null,
    avatar_url: null,
    bio: "Formulating laws of motion and universal gravitation.",
    intention: "Deep work on Newton's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Physics Pioneers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Classical mechanics, Optics, Calculus",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum physics, Relativity",
    need_help_with_visibility: ['organisation'],
    host_code: "greynewton",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-einstein",
    first_name: "Einstein",
    last_name: null,
    avatar_url: null,
    bio: "Developing theories of relativity and quantum mechanics.",
    intention: "Deep work on Einstein's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Physics Pioneers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Relativity, Quantum theory, Theoretical physics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Unified field theory, Cosmology",
    need_help_with_visibility: ['organisation'],
    host_code: "blackeinstein",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-curie",
    first_name: "Curie",
    last_name: null,
    avatar_url: null,
    bio: "Pioneering research on radioactivity and discovering new elements.",
    intention: "Deep work on Curie's discoveries.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Chemistry Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Radioactivity, Analytical chemistry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Nuclear physics, Medical applications of isotopes",
    need_help_with_visibility: ['organisation'],
    host_code: "whitecurie",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-darwin",
    first_name: "Darwin",
    last_name: null,
    avatar_url: null,
    bio: "Proposing the theory of evolution by natural selection.",
    intention: "Deep work on Darwin's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Biology Explorers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Evolutionary biology, Natural selection",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Genetics, Molecular biology",
    need_help_with_visibility: ['organisation'],
    host_code: "golddarwin",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-galileo",
    first_name: "Galileo",
    last_name: null,
    avatar_url: null,
    bio: "Making astronomical observations and advocating for heliocentrism.",
    intention: "Deep work on Galileo's observations.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Astronomy, Physics, Scientific method",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum physics, Astrophysics",
    need_help_with_visibility: ['organisation'],
    host_code: "silvergalileo",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hawking",
    first_name: "Hawking",
    last_name: null,
    avatar_url: null,
    bio: "Advancing theories of black holes and cosmology.",
    intention: "Deep work on Hawking's theories.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Cosmology Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Black holes, Cosmology, Quantum gravity",
    can_help_with_visibility: ['organisation'],
    need_help_with: "String theory, Observational astronomy",
    need_help_with_visibility: ['organisation'],
    host_code: "bronzehawking",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-turing",
    first_name: "Turing",
    last_name: null,
    avatar_url: null,
    bio: "Pioneering theoretical computer science and artificial intelligence.",
    intention: "Deep work on Turing's concepts.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "AI Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Theoretical computer science, AI, Cryptography",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Machine learning, Quantum computing",
    need_help_with_visibility: ['organisation'],
    host_code: "indigoturing",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-hypatia",
    first_name: "Hypatia",
    last_name: null,
    avatar_url: null,
    bio: "Teaching philosophy, mathematics, and astronomy in ancient Alexandria.",
    intention: "Deep work on Hypatia's teachings.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Alexandrian Scholars",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Ancient philosophy, Mathematics, Astronomy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern scientific notation, Telescope technology",
    need_help_with_visibility: ['organisation'],
    host_code: "violethypatia",
    pronouns: "She/Her",
  },
  {
    id: "mock-user-id-copernicus",
    first_name: "Copernicus",
    last_name: null,
    avatar_url: null,
    bio: "Proposing the heliocentric model of the universe.",
    intention: "Deep work on Copernicus' model.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Heliocentric model, Observational astronomy",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Orbital mechanics, Gravitational theory",
    need_help_with_visibility: ['organisation'],
    host_code: "tealcopernicus",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-kepler",
    first_name: "Kepler",
    last_name: null,
    avatar_url: null,
    bio: "Formulating laws of planetary motion.",
    intention: "Deep work on Kepler's laws.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Astronomy Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Planetary motion, Celestial mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Spacecraft trajectory, Exoplanet detection",
    need_help_with_visibility: ['organisation'],
    host_code: "cyankepler",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-bohr",
    first_name: "Bohr",
    last_name: null,
    avatar_url: null,
    bio: "Developing the atomic model and quantum theory.",
    intention: "Deep work on Bohr's model.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Atomic structure, Quantum mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Particle physics, Quantum field theory",
    need_help_with_visibility: ['organisation'],
    host_code: "magentabohr",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-heisenberg",
    first_name: "Heisenberg",
    last_name: null,
    avatar_url: null,
    bio: "Formulating the uncertainty principle in quantum mechanics.",
    intention: "Deep work on Heisenberg's principle.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Uncertainty principle, Matrix mechanics",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum entanglement, Quantum computing",
    need_help_with_visibility: ['organisation'],
    host_code: "limeheisenberg",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-schrodinger",
    first_name: "Schrödinger",
    last_name: null,
    avatar_url: null,
    bio: "Developing wave mechanics and the Schrödinger equation.",
    intention: "Deep work on Schrödinger's equation.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Quantum Physics Group",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Wave mechanics, Quantum states",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum measurement problem, Decoherence",
    need_help_with_visibility: ['organisation'],
    host_code: "maroonschrodinger",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-maxwell",
    first_name: "Maxwell",
    last_name: null,
    avatar_url: null,
    bio: "Formulating classical theory of electromagnetic radiation.",
    intention: "Deep work on Maxwell's equations.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Electromagnetism Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electromagnetism, Classical field theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Quantum electrodynamics, Plasma physics",
    need_help_with_visibility: ['organisation'],
    host_code: "navymaxwell",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-faraday",
    first_name: "Faraday",
    last_name: null,
    avatar_url: null,
    bio: "Discovering electromagnetic induction and diamagnetism.",
    intention: "Deep work on Faraday's experiments.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Electromagnetism Research",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electromagnetic induction, Electrochemistry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Superconductivity, Magnetohydrodynamics",
    need_help_with_visibility: ['organisation'],
    host_code: "olivefaraday",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pascal",
    first_name: "Pascal",
    last_name: null,
    avatar_url: null,
    bio: "Contributing to probability theory and fluid mechanics.",
    intention: "Deep work on Pascal's principles.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Mathematics & Physics Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Probability, Fluid mechanics, Number theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Stochastic processes, Quantum field theory",
    need_help_with_visibility: ['organisation'],
    host_code: "aquapascal",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-leibniz",
    first_name: "Leibniz",
    last_name: null,
    avatar_url: null,
    bio: "Developing calculus and philosophical optimism.",
    intention: "Deep work on Leibniz's philosophy.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Mathematics & Philosophy Society",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Calculus, Metaphysics, Logic",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern logic, Philosophy of language",
    need_help_with_visibility: ['organisation'],
    host_code: "fuchsialeibniz",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-pythagoras",
    first_name: "Pythagoras",
    last_name: null,
    avatar_url: null,
    bio: "Exploring mathematics, music, and philosophy.",
    intention: "Deep work on Pythagorean theorem.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Mathematics Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Geometry, Number theory, Music theory",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern algebra, Abstract mathematics",
    need_help_with_visibility: ['organisation'],
    host_code: "azurepythagoras",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-euclid",
    first_name: "Euclid",
    last_name: null,
    avatar_url: null,
    bio: "Systematizing geometry in 'Elements'.",
    intention: "Deep work on Euclidean geometry.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Mathematics Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Euclidean geometry, Axiomatic systems",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Non-Euclidean geometry, Topology",
    need_help_with_visibility: ['organisation'],
    host_code: "beigeuclid",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-archimedes",
    first_name: "Archimedes",
    last_name: null,
    avatar_url: null,
    bio: "Innovating in mathematics, physics, and engineering.",
    intention: "Deep work on Archimedes' principles.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Engineering Guild",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Mechanics, Hydrostatics, Geometry",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern engineering, Materials science",
    need_help_with_visibility: ['organisation'],
    host_code: "coralarchimedes",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-davinci",
    first_name: "Da Vinci",
    last_name: null,
    avatar_url: null,
    bio: "Mastering art, science, and invention.",
    intention: "Deep work on Da Vinci's inventions.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Renaissance Innovators",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Art, Anatomy, Engineering design",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern art techniques, Digital fabrication",
    need_help_with_visibility: ['organisation'],
    host_code: "crimsondavinci",
    pronouns: "He/Him",
  },
  {
    id: "mock-user-id-franklin",
    first_name: "Franklin",
    last_name: null,
    avatar_url: null,
    bio: "Experimenting with electricity and civic engagement.",
    intention: "Deep work on Franklin's experiments.",
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Enlightenment Thinkers",
    linkedin_url: null,
    bio_visibility: ['public'],
    intention_visibility: ['public'],
    linkedin_visibility: ['public'],
    can_help_with: "Electricity, Political science, Journalism",
    can_help_with_visibility: ['organisation'],
    need_help_with: "Modern energy systems, Digital media",
    need_help_with_visibility: ['organisation'],
    host_code: "lavenderfranklin",
    pronouns: "He/Him",
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

  getPublicProfile: (userId: string, userName: string) => Profile | null;

  bioVisibility: ('public' | 'friends' | 'organisation' | 'private')[]
  setBioVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  intentionVisibility: ('public' | 'friends' | 'organisation' | 'private')[]
  setIntentionVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  linkedinVisibility: ('public' | 'friends' | 'organisation' | 'private')[]
  setLinkedinVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  canHelpWithVisibility: ('public' | 'friends' | 'organisation' | 'private')[]
  setCanHelpWithVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;
  needHelpWithVisibility: ('public' | 'friends' | 'organisation' | 'private')[]
  setNeedHelpWithVisibility: React.Dispatch<React.SetStateAction<('public' | 'friends' | 'organisation' | 'private')[]>>;

  pronouns: string | null;
  setPronouns: React.Dispatch<React.SetStateAction<string | null>>;

  friendStatuses: Record<string, 'none' | 'pending' | 'friends'>;
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (targetUserId: string) => void;
  removeFriend: (targetUserId: string) => void;

  // NEW: Individual profile fields and their setters
  bio: string | null;
  setBio: React.Dispatch<React.SetStateAction<string | null>>;
  intention: string | null;
  setIntention: React.Dispatch<React.SetStateAction<string | null>>;
  canHelpWith: string | null;
  setCanHelpWith: React.Dispatch<React.SetStateAction<string | null>>;
  needHelpWith: string | null;
  setNeedHelpWith: React.Dispatch<React.SetStateAction<string | null>>;
  focusPreference: number;
  setFocusPreference: React.Dispatch<React.SetStateAction<number>>;
  organization: string | null;
  setOrganization: React.Dispatch<React.SetStateAction<string | null>>;
  linkedinUrl: string | null;
  setLinkedinUrl: React.Dispatch<React.SetStateAction<string | null>>;
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
  areToastsEnabled: boolean;
}

const BLOCKED_USERS_KEY = 'deepsesh_blocked_users';
const LOCAL_STORAGE_FRIEND_STATUSES_KEY = 'deepsesh_friend_statuses';

// Helper function to safely parse JSON from local storage
const safeJSONParse = <T extends unknown>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    // localStorage.removeItem(key); // Clear bad data - REMOVED
    return defaultValue;
  }
};

// Helper to generate random host code
const generateRandomHostCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  return `${randomColor}${randomAnimal}`;
};

export const ProfileProvider = ({ children, areToastsEnabled }: ProfileProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isGlobalPrivate, setProfileVisibility: setGlobalProfileVisibility } = useTimer(); // NEW: Access isGlobalPrivate and setProfileVisibility from TimerContext

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Individual state variables (Initialize from local storage)
  const [localFirstName, setLocalFirstName] = useState<string>(safeJSONParse('deepsesh_local_first_name', "You"));
  const [bio, setBio] = useState<string | null>(safeJSONParse('deepsesh_bio', null));
  const [intention, setIntention] = useState<string | null>(safeJSONParse('deepsesh_intention', null));
  const [canHelpWith, setCanHelpWith] = useState<string | null>(safeJSONParse('deepsesh_can_help_with', null));
  const [needHelpWith, setNeedHelpWith] = useState<string | null>(safeJSONParse('deepsesh_need_help_with', null));
  const [focusPreference, setFocusPreference] = useState<number>(safeJSONParse('deepsesh_focus_preference', 50));
  const [organization, setOrganization] = useState<string | null>(safeJSONParse('deepsesh_organization', null));
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(safeJSONParse('deepsesh_linkedin_url', null));
  const [pronouns, setPronouns] = useState<string | null>(safeJSONParse('deepsesh_pronouns', null));
  const [hostCode, setHostCode] = useState<string>(safeJSONParse('deepsesh_host_code', generateRandomHostCode()));

  const [bioVisibility, setBioVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(safeJSONParse('deepsesh_bio_visibility', ['public']));
  const [intentionVisibility, setIntentionVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(safeJSONParse('deepsesh_intention_visibility', ['public']));
  const [linkedinVisibility, setLinkedinVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(safeJSONParse('deepsesh_linkedin_visibility', ['public']));
  const [canHelpWithVisibility, setCanHelpWithVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(safeJSONParse('deepsesh_can_help_with_visibility', ['public']));
  const [needHelpWithVisibility, setNeedHelpWithVisibility] = useState<('public' | 'friends' | 'organisation' | 'private')[]>(safeJSONParse('deepsesh_need_help_with_visibility', ['public']));

  const [blockedUsers, setBlockedUsers] = useState<string[]>(safeJSONParse(BLOCKED_USERS_KEY, []));
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'friends'>>({});
  const friendRequestTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Computed profile object for consistency
  const profile = useMemo<Profile>(() => ({
    id: user?.id || "anon-user", // Use Supabase ID if available, otherwise a placeholder
    first_name: localFirstName,
    last_name: null, // Not currently managed
    avatar_url: null, // Not currently managed
    bio,
    intention,
    linkedin_url: linkedinUrl,
    organization,
    focus_preference: focusPreference,
    updated_at: new Date().toISOString(), // Always update on change
    host_code: hostCode,
    bio_visibility: bioVisibility,
    intention_visibility: intentionVisibility,
    linkedin_visibility: linkedinVisibility,
    can_help_with: canHelpWith,
    can_help_with_visibility: canHelpWithVisibility,
    need_help_with: needHelpWith,
    need_help_with_visibility: needHelpWithVisibility,
    pronouns,
  }), [
    user?.id, localFirstName, bio, intention, linkedinUrl, organization, focusPreference, hostCode,
    bioVisibility, intentionVisibility, linkedinVisibility, canHelpWith, canHelpWithVisibility,
    needHelpWith, needHelpWithVisibility, pronouns
  ]);

  // Effects to save individual states to local storage
  useEffect(() => { localStorage.setItem('deepsesh_local_first_name', JSON.stringify(localFirstName)); }, [localFirstName]);
  useEffect(() => { localStorage.setItem('deepsesh_bio', JSON.stringify(bio)); }, [bio]);
  useEffect(() => { localStorage.setItem('deepsesh_intention', JSON.stringify(intention)); }, [intention]);
  useEffect(() => { localStorage.setItem('deepsesh_can_help_with', JSON.stringify(canHelpWith)); }, [canHelpWith]);
  useEffect(() => { localStorage.setItem('deepsesh_need_help_with', JSON.stringify(needHelpWith)); }, [needHelpWith]);
  useEffect(() => { localStorage.setItem('deepsesh_focus_preference', JSON.stringify(focusPreference)); }, [focusPreference]);
  useEffect(() => { localStorage.setItem('deepsesh_organization', JSON.stringify(organization)); }, [organization]);
  useEffect(() => { localStorage.setItem('deepsesh_linkedin_url', JSON.stringify(linkedinUrl)); }, [linkedinUrl]);
  useEffect(() => { localStorage.setItem('deepsesh_pronouns', JSON.stringify(pronouns)); }, [pronouns]);
  useEffect(() => { localStorage.setItem('deepsesh_host_code', JSON.stringify(hostCode)); }, [hostCode]);
  useEffect(() => { localStorage.setItem('deepsesh_bio_visibility', JSON.stringify(bioVisibility)); }, [bioVisibility]);
  useEffect(() => { localStorage.setItem('deepsesh_intention_visibility', JSON.stringify(intentionVisibility)); }, [intentionVisibility]);
  useEffect(() => { localStorage.setItem('deepsesh_linkedin_visibility', JSON.stringify(linkedinVisibility)); }, [linkedinVisibility]);
  useEffect(() => { localStorage.setItem('deepsesh_can_help_with_visibility', JSON.stringify(canHelpWithVisibility)); }, [canHelpWithVisibility]);
  useEffect(() => { localStorage.setItem('deepsesh_need_help_with_visibility', JSON.stringify(needHelpWithVisibility)); }, [needHelpWithVisibility]);

  // Sync global profile visibility from TimerContext to local state
  useEffect(() => {
    setGlobalProfileVisibility(bioVisibility);
  }, [bioVisibility, setGlobalProfileVisibility]);

  const recentCoworkers = useMemo(() => {
    const uniqueNames = new Set<string>();
    const mockNearbyParticipants = [
      { id: "mock-user-id-bezos", name: "Altman", focus_preference: 20, intention: "Optimizing cloud infrastructure." },
      { id: "mock-user-id-musk", name: "Musk", focus_preference: 10, intention: "Designing reusable rocket components." },
      { id: "mock-user-id-zuckerberg", name: "Zuckerberg", focus_preference: 20, intention: "Developing new social algorithms." },
      { id: "mock-user-id-gates", name: "Amodei", focus_preference: 20, intention: "Refining operating system architecture." },
      { id: "mock-user-id-jobs", name: "Huang", focus_preference: 30, intention: "Innovating user interface design." },
    ];
    const mockFriendsParticipants = [
      { id: "mock-user-id-freud", name: "Freud", focus_preference: 60, intention: "Reviewing psychoanalytic theories." },
      { id: "mock-user-id-skinner", name: "Skinner", focus_preference: 60, intention: "Memorizing behavioral principles." },
      { id: "mock-user-id-piaget", name: "Piaget", focus_preference: 70, intention: "Practicing cognitive development questions." },
      { id: "mock-user-id-jung", name: "Jung", focus_preference: 60, intention: "Summarizing archetypal concepts." },
      { id: "mock-user-id-maslow", name: "Maslow", focus_preference: 50, intention: "Creating hierarchy of needs flashcards." },
      { id: "mock-user-id-rogers", name: "Rogers", focus_preference: 55, intention: "Discussing humanistic approaches." },
      { id: "mock-user-id-bandura", name: "Bandura", focus_preference: 65, intention: "Collaborating on social learning theory guide." },
      { id: "mock-user-id-pavlov", name: "Pavlov", focus_preference: 70, intention: "Peer teaching classical conditioning." },
    ];

    [...mockNearbyParticipants, ...mockFriendsParticipants].forEach(p => uniqueNames.add(p.name));

    return Array.from(uniqueNames).sort();
  }, []);

  const blockUser = useCallback((userName: string) => {
    const trimmedName = userName.trim();
    if (trimmedName && !blockedUsers.includes(trimmedName)) {
      setBlockedUsers(prev => [...prev, trimmedName]);
      if (areToastsEnabled) {
        toast.success(`'${trimmedName}' has been blocked.`, {
          description: "They will no longer see your sessions.",
        });
      }
    } else if (trimmedName && blockedUsers.includes(trimmedName)) {
      if (areToastsEnabled) {
        toast.info(`'${trimmedName}' is already blocked.`, {
          description: "No changes made.",
        });
      }
    }
  }, [blockedUsers, areToastsEnabled]);

  const unblockUser = useCallback((userName: string) => {
    const trimmedName = userName.trim();
    if (trimmedName && blockedUsers.includes(trimmedName)) {
      setBlockedUsers(prev => prev.filter(name => name !== trimmedName));
      if (areToastsEnabled) {
        toast.success(`'${trimmedName}' has been unblocked.`, {
          description: "They can now see your sessions again.",
        });
      }
    } else if (trimmedName && !blockedUsers.includes(trimmedName)) {
      if (areToastsEnabled) {
        toast.info(`'${trimmedName}' is not in your blocked list.`, {
          description: "No changes made.",
        });
      }
    }
  }, [blockedUsers, areToastsEnabled]);

  const sendFriendRequest = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'pending' }));
    if (areToastsEnabled) {
      toast.success("Friend request sent!", {
        description: "They will be notified of your request.",
      });
    }

    const timeoutId = setTimeout(() => {
      setFriendStatuses(prev => {
        if (prev[targetUserId] === 'pending') {
          if (areToastsEnabled) {
            toast.success(`Friend request from ${targetUserId} accepted!`, {
              description: "You are now friends!",
            });
          }
          return { ...prev, [targetUserId]: 'friends' };
        }
        return prev;
      });
      friendRequestTimeouts.current.delete(targetUserId);
    }, 3000);

    friendRequestTimeouts.current.set(targetUserId, timeoutId);
  }, [areToastsEnabled]);

  const acceptFriendRequest = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'friends' }));
    if (areToastsEnabled) {
      toast.success("Friend request accepted!", {
        description: "You are now friends!",
      });
    }
    if (friendRequestTimeouts.current.has(targetUserId)) {
      clearTimeout(friendRequestTimeouts.current.get(targetUserId)!);
      friendRequestTimeouts.current.delete(targetUserId);
    }
  }, [areToastsEnabled]);

  const removeFriend = useCallback((targetUserId: string) => {
    setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'none' }));
    if (areToastsEnabled) {
      toast.info("Friend removed.", {
        description: "You are no longer friends.",
      });
    }
    if (friendRequestTimeouts.current.has(targetUserId)) {
      clearTimeout(friendRequestTimeouts.current.get(targetUserId)!);
      friendRequestTimeouts.current.delete(targetUserId);
    }
  }, [areToastsEnabled]);

  // This function now primarily ensures local state is consistent and conditionally syncs to Supabase
  const updateProfile = useCallback(async (data: ProfileUpdate, successMessage?: string) => {
    setLoading(true);
    setError(null);

    // Update local states directly
    if (data.first_name !== undefined) setLocalFirstName(data.first_name || "You");
    if (data.bio !== undefined) setBio(data.bio);
    if (data.intention !== undefined) setIntention(data.intention);
    if (data.can_help_with !== undefined) setCanHelpWith(data.can_help_with);
    if (data.need_help_with !== undefined) setNeedHelpWith(data.need_help_with);
    if (data.focus_preference !== undefined) setFocusPreference(data.focus_preference);
    if (data.organization !== undefined) setOrganization(data.organization);
    if (data.linkedin_url !== undefined) setLinkedinUrl(data.linkedin_url);
    if (data.pronouns !== undefined) setPronouns(data.pronouns);
    if (data.host_code !== undefined) setHostCode(data.host_code);

    // Update visibility states
    if (data.bio_visibility !== undefined) setBioVisibility(data.bio_visibility);
    if (data.intention_visibility !== undefined) setIntentionVisibility(data.intention_visibility);
    if (data.linkedin_visibility !== undefined) setLinkedinVisibility(data.linkedin_visibility);
    if (data.can_help_with_visibility !== undefined) setCanHelpWithVisibility(data.can_help_with_visibility);
    if (data.need_help_with_visibility !== undefined) setNeedHelpWithVisibility(data.need_help_with_visibility);

    // Conditionally sync to Supabase
    if (user?.id) {
      const isProfilePrivate = isGlobalPrivate || bioVisibility.includes('private'); // Check global and specific bio visibility
      const profileDataForSupabase = {
        id: user.id,
        first_name: data.first_name ?? localFirstName,
        last_name: data.last_name ?? null, // Assuming last_name is not locally managed
        avatar_url: data.avatar_url ?? null, // Assuming avatar_url is not locally managed
        bio: data.bio ?? bio,
        intention: data.intention ?? intention,
        linkedin_url: data.linkedin_url ?? linkedinUrl,
        organization: data.organization ?? organization,
        focus_preference: data.focus_preference ?? focusPreference,
        host_code: data.host_code ?? hostCode,
        bio_visibility: data.bio_visibility ?? bioVisibility,
        intention_visibility: data.intention_visibility ?? intentionVisibility,
        linkedin_visibility: data.linkedin_visibility ?? linkedinVisibility,
        can_help_with: data.can_help_with ?? canHelpWith,
        can_help_with_visibility: data.can_help_with_visibility ?? canHelpWithVisibility,
        need_help_with: data.need_help_with ?? needHelpWith,
        need_help_with_visibility: data.need_help_with_visibility ?? needHelpWithVisibility,
        pronouns: data.pronouns ?? pronouns,
        updated_at: new Date().toISOString(),
      };

      if (isProfilePrivate) {
        // If profile is private, delete it from Supabase
        try {
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 means "no rows found", which is fine for delete
            throw deleteError;
          }
          console.log("Profile removed from Supabase due to privacy settings.");
        } catch (err: any) {
          console.error("Error deleting profile from Supabase:", err.message);
          setError(err.message);
        }
      } else {
        // Upsert (insert or update) profile to Supabase
        try {
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileDataForSupabase, { onConflict: 'id' });

          if (upsertError) throw upsertError;
          console.log("Profile synced to Supabase:", profileDataForSupabase.first_name);
        } catch (err: any) {
          console.error("Error syncing profile to Supabase:", err.message);
          setError(err.message);
        }
      }
    }

    if (areToastsEnabled) {
      toast.success(successMessage || "Profile updated!", {
        description: "Your profile has been successfully saved locally.",
      });
    }
    setLoading(false);
  }, [
    user?.id, areToastsEnabled, isGlobalPrivate, localFirstName, bio, intention, canHelpWith, needHelpWith,
    focusPreference, organization, linkedinUrl, pronouns, hostCode, bioVisibility, intentionVisibility,
    linkedinVisibility, canHelpWithVisibility, needHelpWithVisibility
  ]);

  // This function is now simplified as local state is the source of truth
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    // All profile data is already loaded from local storage via useState initializers
    // No need to fetch from Supabase for the current user's profile here.
    setLoading(false);
  }, []);

  const getPublicProfile = useCallback(async (userId: string, userName: string): Promise<Profile | null> => {
    // First, check mock profiles
    const mockProfile = mockProfiles.find(p => p.id === userId || p.first_name === userName);
    if (mockProfile) {
      return mockProfile;
    }

    // If not found in mocks, try to fetch from Supabase (for other users)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found", which is fine
        throw error;
      }

      if (data) {
        return data as Profile;
      }
    } catch (err: any) {
      console.error("Error fetching public profile from Supabase:", err.message);
      // Continue to return a basic profile even if Supabase fetch fails
    }

    // Fallback to a basic profile if not found in mocks or Supabase
    return {
      id: userId,
      first_name: userName,
      last_name: null,
      avatar_url: null,
      bio: null,
      intention: null,
      focus_preference: 50,
      updated_at: new Date().toISOString(),
      organization: null,
      linkedin_url: null,
      host_code: null,
      bio_visibility: ['public'],
      intention_visibility: ['public'],
      linkedin_visibility: ['public'],
      can_help_with: null,
      can_help_with_visibility: ['public'],
      need_help_with: null,
      need_help_with_visibility: ['public'],
      pronouns: null,
    };
  }, []);

  const resetProfile = useCallback(() => {
    localStorage.clear(); // Clear all local storage for a full reset
    window.location.reload(); // Reload the app to re-initialize all contexts
  }, []);

  useEffect(() => {
    // Initialize friend statuses from local storage
    setFriendStatuses(safeJSONParse(LOCAL_STORAGE_FRIEND_STATUSES_KEY, {}));

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === BLOCKED_USERS_KEY) {
        setBlockedUsers(safeJSONParse(BLOCKED_USERS_KEY, []));
      }
      if (event.key === LOCAL_STORAGE_FRIEND_STATUSES_KEY) {
        setFriendStatuses(safeJSONParse(LOCAL_STORAGE_FRIEND_STATUSES_KEY, {}));
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      friendRequestTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
      friendRequestTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedUsers));
  }, [blockedUsers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FRIEND_STATUSES_KEY, JSON.stringify(friendStatuses));
  }, [friendStatuses]);

  // Ensure hostCode is never empty after initial load
  useEffect(() => {
    if (!hostCode) {
      const newHostCode = generateRandomHostCode();
      setHostCode(newHostCode);
      // No need to call updateProfile here, as setHostCode will trigger local storage save
      // and subsequent sync if profile is public.
      console.log("Generated and set new host code because it was empty:", newHostCode);
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
    canHelpWithVisibility,
    setCanHelpWithVisibility,
    needHelpWithVisibility,
    setNeedHelpWithVisibility,
    pronouns,
    setPronouns,
    friendStatuses,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    bio, setBio,
    intention, setIntention,
    canHelpWith, setCanHelpWith,
    needHelpWith, setNeedHelpWith,
    focusPreference, setFocusPreference,
    organization, setOrganization,
    linkedinUrl, setLinkedinUrl,
    resetProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};