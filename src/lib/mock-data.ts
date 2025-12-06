import { Profile, ProfileDataField, ProfileDataJsonb, OrganisationEntry } from "@/contexts/ProfileContext"; // MODIFIED: Import OrganisationEntry
import { DemoSession, ScheduledTimer, ParticipantSessionData } from "@/types/timer";
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
  organisation: [], // MODIFIED: Default to empty array of OrganisationEntry
});

export const MOCK_PROFILES: Profile[] = [
  {
    id: "a1b2c3d4-e5f6-4789-8012-34567890abcd",
    first_name: "Sam Altman",
    last_name: null,
    avatar_url: null,
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Leading AI research.", ['public']),
      intention: getDefaultProfileDataField("Focusing on AGI.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/samaltman", ['public']),
      can_help_with: getDefaultProfileDataField("AI strategy", ['public']),
      need_help_with: getDefaultProfileDataField("AI safety", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "OpenAI", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "b2c3d4e5-f6a7-4890-8123-4567890abcdef0",
    first_name: "Musk",
    last_name: null,
    avatar_url: null,
    focus_preference: 10,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Designing rockets.", ['public']),
      intention: getDefaultProfileDataField("Innovating space travel.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/elonmusk", ['public']),
      can_help_with: getDefaultProfileDataField("Rocket engineering", ['public']),
      need_help_with: getDefaultProfileDataField("Mars colonization", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "SpaceX", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "c3d4e5f6-a7b8-4901-8234-567890abcdef01",
    first_name: "Freud",
    last_name: null,
    avatar_url: null,
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Reviewing psychoanalytic theories.", ['public']),
      intention: getDefaultProfileDataField("Unraveling human behavior.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/sigmundfreud", ['public']),
      can_help_with: getDefaultProfileDataField("Psychoanalysis", ['friends']),
      need_help_with: getDefaultProfileDataField("Modern neuroscience", ['friends']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Psychology Dept.", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "d4e5f6a7-b8c9-4012-8345-67890abcdef012",
    first_name: "Aristotle",
    last_name: null,
    avatar_url: null,
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Studying logic.", ['public']),
      intention: getDefaultProfileDataField("Deep work on theories.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Logic", ['organisation']),
      need_help_with: getDefaultProfileDataField("Modern science", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Ancient Philosophy Guild", visibility: ['organisation'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "e5f6a7b8-c9d0-4123-8456-7890abcdef0123",
    first_name: "Plato",
    last_name: null,
    avatar_url: null,
    focus_preference: 40,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring ideal forms.", ['public']),
      intention: getDefaultProfileDataField("Writing dialogues.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Metaphysics", ['organisation']),
      need_help_with: getDefaultProfileDataField("Political theory", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Ancient Philosophy Guild", visibility: ['organisation'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "f6a7b8c9-d0e1-4234-8567-890abcdef01234",
    first_name: "Socrates",
    last_name: null,
    avatar_url: null,
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Questioning everything.", ['public']),
      intention: getDefaultProfileDataField("Seeking wisdom.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Critical thinking", ['organisation']),
      need_help_with: getDefaultProfileDataField("Self-knowledge", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Ancient Philosophy Guild", visibility: ['organisation'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "a0b1c2d3-e4f5-4678-9012-34567890abcd",
    first_name: "Jake",
    last_name: null,
    avatar_url: null,
    focus_preference: 85,
    updated_at: new Date().toISOString(),
    join_code: "DeepSeshJake",
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Founder of DeepSesh", ['public']),
      intention: getDefaultProfileDataField("put WeWork out of business", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/jacobvxyz", ['public']),
      can_help_with: getDefaultProfileDataField("building community with attention-respecting algorithms.", ['public']),
      need_help_with: getDefaultProfileDataField("creating a win-win culture among all coworkers", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [ // MODIFIED: Organisation as OrganisationEntry[]
        { name: "DeepSesh", visibility: ['public'] },
        { name: "StartSpace", visibility: ['public'] }
      ],
    },
  },
  {
    id: "g7h8i9j0-k1l2-4345-8678-90abcdef012345",
    first_name: "Rogers",
    last_name: null,
    avatar_url: null,
    focus_preference: 75,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring client-centered therapy.", ['public']),
      intention: getDefaultProfileDataField("Promoting self-actualization.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Empathy, unconditional positive regard", ['public']),
      need_help_with: getDefaultProfileDataField("Existential philosophy", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Humanistic Psychology", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "h8i9j0k1-l2m3-4456-8789-0abcdef0123456",
    first_name: "Maslow",
    last_name: null,
    avatar_url: null,
    focus_preference: 80,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Developing hierarchy of needs.", ['public']),
      intention: getDefaultProfileDataField("Understanding human motivation.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Motivation theory, peak experiences", ['public']),
      need_help_with: getDefaultProfileDataField("Transpersonal psychology", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: [{ name: "Humanistic Psychology", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
  {
    id: "i9j0k1l2-m3n4-4567-8890-abcdef01234567",
    first_name: "Esther Perel",
    last_name: null,
    avatar_url: null,
    focus_preference: 90,
    updated_at: new Date().toISOString(),
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring modern relationships.", ['public']),
      intention: getDefaultProfileDataField("Fostering erotic intelligence.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/estherperel", ['public']),
      can_help_with: getDefaultProfileDataField("Relationship dynamics, infidelity", ['public']),
      need_help_with: getDefaultProfileDataField("Cultural anthropology", ['public']),
      pronouns: getDefaultProfileDataField("She/Her", ['public']),
      organisation: [{ name: "Relationship Therapy", visibility: ['public'] }], // MODIFIED: Organisation as OrganisationEntry[]
    },
  },
];

export const MOCK_SESSIONS: DemoSession[] = [
  {
    id: "mock-session-1",
    title: "Deep Work Session",
    startTime: Date.now() - 30 * 60 * 1000, // Started 30 minutes ago
    location: "Virtual",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "A quiet session for focused work.",
    participants: [
      { userId: MOCK_PROFILES[0].id, userName: MOCK_PROFILES[0].first_name || "Sam Altman", joinTime: Date.now() - 30 * 60 * 1000, role: 'host', focusPreference: MOCK_PROFILES[0].focus_preference },
      { userId: MOCK_PROFILES[1].id, userName: MOCK_PROFILES[1].first_name || "Musk", joinTime: Date.now() - 20 * 60 * 1000, role: 'coworker', focusPreference: MOCK_PROFILES[1].focus_preference },
    ],
    fullSchedule: [
      { id: "s1-t1", title: "Focus", type: "focus", durationMinutes: 45 },
      { id: "s1-t2", title: "Break", type: "break", durationMinutes: 15 },
      { id: "s1-t3", title: "Focus", type: "focus", durationMinutes: 45 },
    ],
    location_lat: -37.8136, // Melbourne CBD
    location_long: 144.9631,
    distance: 500, // Example distance in meters
    visibility: 'public',
    user_id: MOCK_PROFILES[0].id,
    join_code: "DEEPSESH1",
    organisation: ["OpenAI"], // This remains string[] as it's for active_sessions table
    host_notes: "Working on AI safety research. Join if you're into that!",
    is_mock: true,
  },
  {
    id: "mock-session-2",
    title: "Brainstorming & Banter",
    startTime: Date.now() - 10 * 60 * 1000, // Started 10 minutes ago
    location: "Cafe",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Open for creative ideas and light chat.",
    participants: [
      { userId: MOCK_PROFILES[2].id, userName: MOCK_PROFILES[2].first_name || "Freud", joinTime: Date.now() - 10 * 60 * 1000, role: 'host', focusPreference: MOCK_PROFILES[2].focus_preference },
    ],
    fullSchedule: [
      { id: "s2-t1", title: "Brainstorm", type: "focus", durationMinutes: 20 },
      { id: "s2-t2", title: "Chat", type: "break", durationMinutes: 10 },
    ],
    location_lat: -37.8150,
    location_long: 144.9650,
    distance: 1200,
    visibility: 'public',
    user_id: MOCK_PROFILES[2].id,
    join_code: "BANTERBUDDIES",
    organisation: ["Psychology Dept."], // This remains string[] as it's for active_sessions table
    host_notes: "Discussing new psychological theories. All welcome!",
    is_mock: true,
  },
  {
    id: "mock-session-3",
    title: "Organisation Sync",
    startTime: Date.now() - 5 * 60 * 1000, // Started 5 minutes ago
    location: "Office",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Internal team meeting.",
    participants: [
      { userId: MOCK_PROFILES[3].id, userName: MOCK_PROFILES[3].first_name || "Aristotle", joinTime: Date.now() - 5 * 60 * 1000, role: 'host', focusPreference: MOCK_PROFILES[3].focus_preference },
      { userId: MOCK_PROFILES[4].id, userName: MOCK_PROFILES[4].first_name || "Plato", joinTime: Date.now() - 3 * 60 * 1000, role: 'coworker', focusPreference: MOCK_PROFILES[4].focus_preference },
    ],
    fullSchedule: [
      { id: "s3-t1", title: "Project Review", type: "focus", durationMinutes: 30 },
      { id: "s3-t2", title: "Team Discussion", type: "break", durationMinutes: 10 },
    ],
    location_lat: -37.8100,
    location_long: 144.9600,
    distance: 800,
    visibility: 'organisation',
    user_id: MOCK_PROFILES[3].id,
    join_code: "PHILOSOPHY",
    organisation: ["Ancient Philosophy Guild"], // This remains string[] as it's for active_sessions table
    host_notes: "Weekly philosophy guild meeting. Bring your latest thoughts!",
    is_mock: true,
  },
  {
    id: "mock-session-4",
    title: "Private Study",
    startTime: Date.now() - 15 * 60 * 1000, // Started 15 minutes ago
    location: "Library",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Heads-down study time.",
    participants: [
      { userId: MOCK_PROFILES[5].id, userName: MOCK_PROFILES[5].first_name || "Socrates", joinTime: Date.now() - 15 * 60 * 1000, role: 'host', focusPreference: MOCK_PROFILES[5].focus_preference },
    ],
    fullSchedule: [
      { id: "s4-t1", title: "Reading", type: "focus", durationMinutes: 60 },
      { id: "s4-t2", title: "Short Break", type: "break", durationMinutes: 5 },
    ],
    location_lat: -37.8180,
    location_long: 144.9700,
    distance: 2000,
    visibility: 'private',
    user_id: MOCK_PROFILES[5].id,
    join_code: "SOLOSTUDY",
    organisation: null,
    host_notes: "Working on my own. Please do not disturb.",
    is_mock: true,
  },
];