import { Profile, ProfileDataField, ProfileDataJsonb } from "@/contexts/ProfileContext";
import { DemoSession, ScheduledTimer, ParticipantSessionData, ActiveAskItem } from "@/types/timer";
import { colors, animals } from '@/lib/constants';

// Helper to generate a random join code
const generateRandomJoinCode = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return `${toTitleCase(randomColor)}${toTitleCase(randomAnimal)}`;
};

// Helper to generate a default ProfileDataField
const getDefaultProfileDataField = (value: string | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
  value,
  visibility,
});

// Helper to generate a default ProfileDataJsonb
const getDefaultProfileDataJsonb = (): ProfileDataJsonb => ({
  bio: getDefaultProfileDataField(null, ['public']),
  intention: getDefaultProfileDataField(null, ['public']),
  linkedin_url: getDefaultProfileDataField(null, ['public']),
  can_help_with: getDefaultProfileDataField(null, ['public']),
  need_help_with: getDefaultProfileDataField(null, ['public']),
  pronouns: getDefaultProfileDataField(null, ['public']),
});

// --- MOCK PROFILES ---
export const MOCK_PROFILES: Profile[] = [
  {
    id: "a1b2c3d4-e5f6-4789-8012-34567890abcd",
    first_name: "Sam Altman",
    last_name: null,
    avatar_url: null,
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    organization: "OpenAI",
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Leading AI research.", ['public']),
      intention: getDefaultProfileDataField("Focusing on AGI.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/samaltman", ['public']),
      can_help_with: getDefaultProfileDataField("AI strategy", ['public']),
      need_help_with: getDefaultProfileDataField("AI safety", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  {
    id: "b2c3d4e5-f6a7-4890-8123-4567890abcdef0",
    first_name: "Musk",
    last_name: null,
    avatar_url: null,
    focus_preference: 10,
    updated_at: new Date().toISOString(),
    organization: "SpaceX",
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Designing rockets.", ['public']),
      intention: getDefaultProfileDataField("Innovating space travel.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/elonmusk", ['public']),
      can_help_with: getDefaultProfileDataField("Rocket engineering", ['public']),
      need_help_with: getDefaultProfileDataField("Mars colonization", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  {
    id: "c3d4e5f6-a7b8-4901-8234-567890abcdef01",
    first_name: "Freud",
    last_name: null,
    avatar_url: null,
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    organization: "Psychology Dept.",
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Reviewing psychoanalytic theories.", ['public']),
      intention: getDefaultProfileDataField("Unraveling human behavior.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/sigmundfreud", ['public']),
      can_help_with: getDefaultProfileDataField("Psychoanalysis", ['friends']),
      need_help_with: getDefaultProfileDataField("Modern neuroscience", ['friends']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  {
    id: "d4e5f6a7-b8c9-4012-8345-67890abcdef012",
    first_name: "Aristotle",
    last_name: null,
    avatar_url: null,
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Studying logic.", ['public']),
      intention: getDefaultProfileDataField("Deep work on theories.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Logic", ['organisation']),
      need_help_with: getDefaultProfileDataField("Modern science", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  {
    id: "e5f6a7b8-c9d0-4123-8456-7890abcdef0123",
    first_name: "Plato",
    last_name: null,
    avatar_url: null,
    focus_preference: 40,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring ideal forms.", ['public']),
      intention: getDefaultProfileDataField("Writing dialogues.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Metaphysics", ['organisation']),
      need_help_with: getDefaultProfileDataField("Political theory", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  {
    id: "f6a7b8c9-d0e1-4234-8567-890abcdef01234",
    first_name: "Socrates",
    last_name: null,
    avatar_url: null,
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    organization: "Ancient Philosophy Guild",
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Questioning everything.", ['public']),
      intention: getDefaultProfileDataField("Seeking wisdom.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Critical thinking", ['organisation']),
      need_help_with: getDefaultProfileDataField("Self-knowledge", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
  // NEW: Jake's profile
  {
    id: "a0b1c2d3-e4f5-4678-9012-34567890abcd", // Unique ID for Jake
    first_name: "Jake",
    last_name: null,
    avatar_url: null,
    focus_preference: 85, // Default focus preference
    updated_at: new Date().toISOString(),
    organization: "DeepSesh",
    join_code: "DeepSeshJake", // A unique join code for Jake
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Founder of DeepSesh", ['public']),
      intention: getDefaultProfileDataField("put WeWork out of business", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/jacobvxyz", ['public']),
      can_help_with: getDefaultProfileDataField("facilitating community building with attention-respecting algorithms.", ['public']),
      need_help_with: getDefaultProfileDataField("creating a win-win culture among all coworkers", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
    }
  },
];

// Helper to create a mock participant
const createMockParticipant = (profile: Profile, role: 'host' | 'coworker'): ParticipantSessionData => ({
  userId: profile.id,
  userName: profile.first_name || "Unknown",
  joinTime: Date.now() - Math.floor(Math.random() * 3600000), // Up to 1 hour ago
  role: role,
  focusPreference: profile.focus_preference || 50,
  intention: profile.profile_data?.intention?.value || undefined,
  bio: profile.profile_data?.bio?.value || undefined,
});

// Helper to create a mock schedule
const createMockSchedule = (): ScheduledTimer[] => [
  { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
  { id: crypto.randomUUID(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
  { id: crypto.randomUUID(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
  { id: crypto.randomUUID(), title: "Long Break", type: "break", durationMinutes: 15, isCustom: false },
];

// --- MOCK SESSIONS ---
export const MOCK_SESSIONS: DemoSession[] = [
  {
    id: "1a2b3c4d-5e6f-4789-8012-34567890abcd",
    title: "Morning Deep Work",
    startTime: Date.now() - 10 * 60 * 1000, // Started 10 minutes ago
    location: "Cafe Corner",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Quiet corner for focused work.",
    participants: [
      createMockParticipant(MOCK_PROFILES[0], 'host'),
      createMockParticipant(MOCK_PROFILES[1], 'coworker'),
    ],
    location_lat: -33.8688 + (Math.random() - 0.5) * 0.01, // Sydney CBD area
    location_long: 151.2093 + (Math.random() - 0.5) * 0.01,
    distance: null,
    active_asks: [],
    visibility: 'public',
    fullSchedule: createMockSchedule(),
    user_id: MOCK_PROFILES[0].id,
    join_code: generateRandomJoinCode(),
    organization: MOCK_PROFILES[0].organization,
  },
  {
    id: "2b3c4d5e-6f7a-4890-8123-4567890abcdef0",
    title: "Afternoon Brainstorm",
    startTime: Date.now() - 30 * 60 * 1000, // Started 30 minutes ago
    location: "Library Study Room",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Collaborative space for ideas.",
    participants: [
      createMockParticipant(MOCK_PROFILES[2], 'host'),
    ],
    location_lat: -33.8688 + (Math.random() - 0.5) * 0.02,
    location_long: 151.2093 + (Math.random() - 0.5) * 0.02,
    distance: null,
    active_asks: [],
    visibility: 'friends',
    fullSchedule: createMockSchedule(),
    user_id: MOCK_PROFILES[2].id,
    join_code: generateRandomJoinCode(),
    organization: MOCK_PROFILES[2].organization,
  },
  {
    id: "3c4d5e6f-7a8b-4901-8234-567890abcdef01",
    title: "Org Project Sync",
    startTime: Date.now() - 5 * 60 * 1000, // Started 5 minutes ago
    location: "Office Meeting Room",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Private room for team sync.",
    participants: [
      createMockParticipant(MOCK_PROFILES[3], 'host'),
      createMockParticipant(MOCK_PROFILES[4], 'coworker'),
      createMockParticipant(MOCK_PROFILES[5], 'coworker'),
    ],
    location_lat: -33.8688 + (Math.random() - 0.5) * 0.005,
    location_long: 151.2093 + (Math.random() - 0.5) * 0.005,
    distance: null,
    active_asks: [],
    visibility: 'organisation',
    fullSchedule: createMockSchedule(),
    user_id: MOCK_PROFILES[3].id,
    join_code: generateRandomJoinCode(),
    organization: MOCK_PROFILES[3].organization,
  },
];