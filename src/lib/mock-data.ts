import { Profile, ProfileDataField, ProfileDataJsonb } from "@/contexts/ProfileContext";
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
const getDefaultProfileDataField = (value: string | string[] | null = null, visibility: ("public" | "friends" | "organisation" | "private")[] = ['public']): ProfileDataField => ({
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
  organisation: getDefaultProfileDataField([], ['public']), // NEW: Default for organisation
});

export const MOCK_PROFILES: Profile[] = [
  {
    id: "a1b2c3d4-e5f6-4789-8012-34567890abcd",
    first_name: "Sam Altman",
    last_name: null,
    avatar_url: null,
    focus_preference: 20,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["OpenAI"],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Leading AI research.", ['public']),
      intention: getDefaultProfileDataField("Focusing on AGI.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/samaltman", ['public']),
      can_help_with: getDefaultProfileDataField("AI strategy", ['public']),
      need_help_with: getDefaultProfileDataField("AI safety", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["OpenAI"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "b2c3d4e5-f6a7-4890-8123-4567890abcdef0",
    first_name: "Musk",
    last_name: null,
    avatar_url: null,
    focus_preference: 10,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["SpaceX"],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Designing rockets.", ['public']),
      intention: getDefaultProfileDataField("Innovating space travel.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/elonmusk", ['public']),
      can_help_with: getDefaultProfileDataField("Rocket engineering", ['public']),
      need_help_with: getDefaultProfileDataField("Mars colonization", ['private']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["SpaceX"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "c3d4e5f6-a7b8-4901-8234-567890abcdef01",
    first_name: "Freud",
    last_name: null,
    avatar_url: null,
    focus_preference: 60,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Psychology Dept."],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Reviewing psychoanalytic theories.", ['public']),
      intention: getDefaultProfileDataField("Unraveling human behavior.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/sigmundfreud", ['public']),
      can_help_with: getDefaultProfileDataField("Psychoanalysis", ['friends']),
      need_help_with: getDefaultProfileDataField("Modern neuroscience", ['friends']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Psychology Dept."], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "d4e5f6a7-b8c9-4012-8345-67890abcdef012",
    first_name: "Aristotle",
    last_name: null,
    avatar_url: null,
    focus_preference: 50,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Ancient Philosophy Guild"],
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Studying logic.", ['public']),
      intention: getDefaultProfileDataField("Deep work on theories.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Logic", ['organisation']),
      need_help_with: getDefaultProfileDataField("Modern science", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Ancient Philosophy Guild"], ['organisation']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "e5f6a7b8-c9d0-4123-8456-7890abcdef0123",
    first_name: "Plato",
    last_name: null,
    avatar_url: null,
    focus_preference: 40,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Ancient Philosophy Guild"],
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring ideal forms.", ['public']),
      intention: getDefaultProfileDataField("Writing dialogues.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Metaphysics", ['organisation']),
      need_help_with: getDefaultProfileDataField("Political theory", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Ancient Philosophy Guild"], ['organisation']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "f6a7b8c9-d0e1-4234-8567-890abcdef01234",
    first_name: "Socrates",
    last_name: null,
    avatar_url: null,
    focus_preference: 70,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Ancient Philosophy Guild"],
    join_code: generateRandomJoinCode(),
    visibility: ['organisation'],
    profile_data: {
      bio: getDefaultProfileDataField("Questioning everything.", ['public']),
      intention: getDefaultProfileDataField("Seeking wisdom.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Critical thinking", ['organisation']),
      need_help_with: getDefaultProfileDataField("Self-knowledge", ['organisation']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Ancient Philosophy Guild"], ['organisation']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "a0b1c2d3-e4f5-4678-9012-34567890abcd",
    first_name: "Jake",
    last_name: null,
    avatar_url: null,
    focus_preference: 85,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["DeepSesh", "StartSpace"],
    join_code: "DeepSeshJake",
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Founder of DeepSesh", ['public']),
      intention: getDefaultProfileDataField("put WeWork out of business", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/jacobvxyz", ['public']),
      can_help_with: getDefaultProfileDataField("building community with attention-respecting algorithms.", ['public']),
      need_help_with: getDefaultProfileDataField("creating a win-win culture among all coworkers", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["DeepSesh", "StartSpace"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "g7h8i9j0-k1l2-4345-8678-90abcdef012345",
    first_name: "Rogers",
    last_name: null,
    avatar_url: null,
    focus_preference: 75,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Humanistic Psychology"],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring client-centered therapy.", ['public']),
      intention: getDefaultProfileDataField("Promoting self-actualization.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Empathy, unconditional positive regard", ['public']),
      need_help_with: getDefaultProfileDataField("Existential philosophy", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Humanistic Psychology"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "h8i9j0k1-l2m3-4456-8789-0abcdef0123456",
    first_name: "Maslow",
    last_name: null,
    avatar_url: null,
    focus_preference: 80,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Humanistic Psychology"],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Developing hierarchy of needs.", ['public']),
      intention: getDefaultProfileDataField("Understanding human motivation.", ['public']),
      linkedin_url: getDefaultProfileDataField(null, ['public']),
      can_help_with: getDefaultProfileDataField("Motivation theory, peak experiences", ['public']),
      need_help_with: getDefaultProfileDataField("Transpersonal psychology", ['public']),
      pronouns: getDefaultProfileDataField("He/Him", ['public']),
      organisation: getDefaultProfileDataField(["Humanistic Psychology"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
  {
    id: "i9j0k1l2-m3n4-4567-8890-abcdef01234567",
    first_name: "Esther Perel",
    last_name: null,
    avatar_url: null,
    focus_preference: 90,
    updated_at: new Date().toISOString(),
    // REMOVED: organisation: ["Relationship Therapy"],
    join_code: generateRandomJoinCode(),
    visibility: ['public'],
    profile_data: {
      bio: getDefaultProfileDataField("Exploring modern relationships.", ['public']),
      intention: getDefaultProfileDataField("Fostering erotic intelligence.", ['public']),
      linkedin_url: getDefaultProfileDataField("https://www.linkedin.com/in/estherperel", ['public']),
      can_help_with: getDefaultProfileDataField("Relationship dynamics, infidelity", ['public']),
      need_help_with: getDefaultProfileDataField("Cultural anthropology", ['public']),
      pronouns: getDefaultProfileDataField("She/Her", ['public']),
      organisation: getDefaultProfileDataField(["Relationship Therapy"], ['public']), // NEW: Organisation as ProfileDataField
    },
  },
];

// Helper to find a mock profile by first name
const findMockProfile = (firstName: string): Profile | undefined => {
  return MOCK_PROFILES.find(p => p.first_name === firstName);
};

// Helper to create a ParticipantSessionData from a mock profile
const createParticipantData = (profile: Profile, role: 'host' | 'coworker'): ParticipantSessionData => ({
  userId: profile.id,
  userName: profile.first_name || "Unknown",
  joinTime: Date.now(),
  role: role,
  focusPreference: profile.focus_preference || 50,
  intention: profile.profile_data?.intention?.value as string || null,
  bio: profile.profile_data?.bio?.value as string || null,
});

// Define mock sessions
const altman = findMockProfile("Sam Altman");
const musk = findMockProfile("Musk");
const freud = findMockProfile("Freud");
const rogers = findMockProfile("Rogers");
const jake = findMockProfile("Jake");

export const MOCK_SESSIONS: DemoSession[] = [
  {
    id: crypto.randomUUID(), // Use crypto.randomUUID()
    title: "Deep Work @ StartSpace",
    startTime: Date.now() - 30 * 60 * 1000, // Started 30 minutes ago
    location: "StartSpace, Melbourne",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "A quiet corner for focused work.",
    participants: [
      altman ? createParticipantData(altman, 'host') : { userId: "mock-altman", userName: "Sam Altman", joinTime: Date.now(), role: 'host', focusPreference: 20 },
      musk ? createParticipantData(musk, 'coworker') : { userId: "mock-musk", userName: "Musk", joinTime: Date.now(), role: 'coworker', focusPreference: 10 },
    ],
    location_lat: -37.8136, // Melbourne latitude
    location_long: 144.9631, // Melbourne longitude
    visibility: 'public',
    fullSchedule: [
      { id: crypto.randomUUID(), title: "Deep Focus", type: "focus", durationMinutes: 45 },
      { id: crypto.randomUUID(), title: "Quick Break", type: "break", durationMinutes: 15 },
      { id: crypto.randomUUID(), title: "Coding Sprint", type: "focus", durationMinutes: 60 },
    ],
    user_id: altman?.id || "mock-altman",
    join_code: "StartSpaceDeep",
    organisation: ["StartSpace", "OpenAI", "SpaceX"],
    host_notes: "Working on a new AI model. Feel free to join for a focused session!",
    is_mock: true,
  },
  {
    id: crypto.randomUUID(), // Use crypto.randomUUID()
    title: "Psych101 Study Sesh",
    startTime: Date.now() - 15 * 60 * 1000, // Started 15 minutes ago
    location: "University Library, Level 3",
    workspaceImage: "/api/placeholder/200/120",
    workspaceDescription: "Reviewing theories of personality.",
    participants: [
      freud ? createParticipantData(freud, 'host') : { userId: "mock-freud", userName: "Freud", joinTime: Date.now(), role: 'host', focusPreference: 60 },
      rogers ? createParticipantData(rogers, 'coworker') : { userId: "mock-rogers", userName: "Rogers", joinTime: Date.now(), role: 'coworker', focusPreference: 75 },
      jake ? createParticipantData(jake, 'coworker') : { userId: "mock-jake", userName: "Jake", joinTime: Date.now(), role: 'coworker', focusPreference: 85 },
    ],
    location_lat: -37.7965, // University of Melbourne latitude
    location_long: 144.9613, // University of Melbourne longitude
    visibility: 'private',
    fullSchedule: [
      { id: crypto.randomUUID(), title: "Reading Chapter 5", type: "focus", durationMinutes: 60 },
      { id: crypto.randomUUID(), title: "Concept Discussion", type: "break", durationMinutes: 20 },
      { id: crypto.randomUUID(), title: "Essay Outline", type: "focus", durationMinutes: 90 },
    ],
    user_id: freud?.id || "mock-freud",
    join_code: "PsychStudy",
    organisation: ["Psychology Dept.", "Humanistic Psychology", "DeepSesh"],
    host_notes: "Reviewing classic psychological theories. Quiet study preferred.",
    is_mock: true,
  },
];