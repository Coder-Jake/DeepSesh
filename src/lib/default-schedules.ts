import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer";
import { DAYS_OF_WEEK } from "@/lib/constants";

// Helper to generate unique IDs for timers within templates
const generateId = () => {
  // Ensure crypto.randomUUID is available in the environment.
  // If not, this will throw an error, indicating a critical environment issue
  // where UUID generation is expected but not supported.
  return crypto.randomUUID();
};

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduledTimerTemplate[] = [
  {
    id: "a1b2c3d4-e5f6-4789-8012-34567890abcd", // NEW UUID
    title: "Pomodoro",
    schedule: [
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5, isCustom: false },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25, isCustom: false },
      { id: generateId(), title: "Long Break", type: "break", durationMinutes: 15, isCustom: false },
    ],
    commenceTime: "09:00",
    commenceDay: null,
    scheduleStartOption: 'now',
    isRecurring: true,
    recurrenceFrequency: 'daily',
    timerColors: {},
  },
  {
    id: "b2c3d4e5-f6a7-4890-8123-4567890abcdef0", // NEW UUID
    title: "School Timetable",
    schedule: [
      { id: generateId(), title: "Mathematics", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Math" },
      { id: generateId(), title: "Economics", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Economics" },
      { id: generateId(), title: "Recess", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Recess" },
      { id: generateId(), title: "Science Lab", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Science Lab" },
      { id: generateId(), title: "PE", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "PE" },
      { id: generateId(), title: "Lunch", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Lunch" },
      { id: generateId(), title: "English Literature", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "English Literature" },
      { id: generateId(), title: "Music", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Music" },
    ],
    commenceTime: "08:30",
    commenceDay: DAYS_OF_WEEK.indexOf("Monday"),
    scheduleStartOption: 'custom_time',
    isRecurring: false,
    recurrenceFrequency: 'weekly',
    timerColors: {},
  },
  {
    id: "c3d4e5f6-a7b8-4901-8234-567890abcdef01", // NEW UUID
    title: "Conference",
    schedule: [
      { id: generateId(), title: "Keynote Address", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Keynote Address" },
      { id: generateId(), title: "Coffee Break", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Coffee Break" },
      { id: generateId(), title: "Session 1", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 1" },
      { id: generateId(), title: "Networking Lunch", type: "break", durationMinutes: 60, isCustom: true, customTitle: "Networking Lunch" },
      { id: generateId(), title: "Session 2", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 2" },
      { id: generateId(), title: "Q&A submissions", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Q&A submissions" },
      { id: generateId(), title: "Panel Discussion", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Panel Discussion" },
      { id: generateId(), title: "Afterparty", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Afterparty" },
    ],
    commenceTime: "09:00",
    commenceDay: null,
    scheduleStartOption: 'manual',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {},
  },
  {
    id: "d4e5f6a7-b8c9-4012-8345-67890abcdef012", // NEW UUID
    title: "Hackathon",
    schedule: [
      { id: generateId(), title: "Mission & Assignment", type: "focus", durationMinutes: 20, isCustom: true, customTitle: "Mission & Assignment" },
      { id: generateId(), title: "Team Sync", type: "break", durationMinutes: 10, isCustom: true, customTitle: "Team Sync" },
      { id: generateId(), title: "Brainstorming", type: "focus", durationMinutes: 90, isCustom: true, customTitle: "Brainstorming" },
      { id: generateId(), title: "Pizza", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Pizza" },
      { id: generateId(), title: "Coding Sprint", type: "focus", durationMinutes: 120, isCustom: true, customTitle: "Coding Sprint" },
      { id: generateId(), title: "Power Nap", type: "break", durationMinutes: 20, isCustom: true, customTitle: "Power Nap" },
      { id: generateId(), title: "Feature Implementation", type: "focus", durationMinutes: 180, isCustom: true, customTitle: "Feature Implementation" },
    ],
    commenceTime: "10:00",
    commenceDay: null,
    scheduleStartOption: 'now',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {},
  },
  {
    id: "e5f6a7b8-c9d0-4123-8456-7890abcdef0123",
    title: "Needle In The Hashtag (Day 1)",
    schedule: [
      { id: generateId(), title: "Registration opens", type: "focus", durationMinutes: 30, isCustom: true },
      { id: generateId(), title: "Opening Ceremony", type: "focus", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Hacking begins", type: "focus", durationMinutes: 30, isCustom: true },
      { id: generateId(), title: "Macken Murphy: “The Manosphere & Incel Ideology”", type: "focus", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Lunch", type: "break", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "David Gilmore: “Incel Radicalisation (Lived Experiences)”", type: "focus", durationMinutes: 120, isCustom: true },
      { id: generateId(), title: "Campbell Wilson: “Countering online child exploitation”", type: "focus", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Afternoon snack", type: "break", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Sarah Davis-Gilmore: 'Lived experience of online harms'", type: "focus", durationMinutes: 90, isCustom: true },
      { id: generateId(), title: "Dinner", type: "break", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Wrap-up / announcements", type: "focus", durationMinutes: 30, isCustom: true },
    ],
    commenceTime: "10:00",
    commenceDay: DAYS_OF_WEEK.indexOf("Saturday"), // Saturday, 29 Nov
    scheduleStartOption: 'custom_time',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {},
  },
  {
    id: "f6a7b8c9-d0e1-4234-8567-890abcdef01234",
    title: "Needle In The Hashtag (Day 2)",
    schedule: [
      { id: generateId(), title: "Morning tea", type: "break", durationMinutes: 120, isCustom: true }, // Includes doors open
      { id: generateId(), title: "Maria & Ellen (eSafety): “All About eSafety”", type: "focus", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Lunch", type: "break", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Alan Agon (PaxMod): “Gaming Lounge Moderation”", type: "focus", durationMinutes: 120, isCustom: true },
      { id: generateId(), title: "Scotty (The Product Bus): 'How to choose a hackathon-winning idea'", type: "focus", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Afternoon snacks", type: "break", durationMinutes: 150, isCustom: true },
      { id: generateId(), title: "Dinner", type: "break", durationMinutes: 60, isCustom: true },
      { id: generateId(), title: "Wrap-up", type: "focus", durationMinutes: 30, isCustom: true },
    ],
    commenceTime: "10:00",
    commenceDay: DAYS_OF_WEEK.indexOf("Sunday"), // Sunday, 30 Nov
    scheduleStartOption: 'custom_time',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {},
  },
  {
    id: "g7h8i9j0-k1l2-4345-8678-90abcdef012345",
    title: "Needle In The Hashtag (Pitch Day)",
    schedule: [
      { id: generateId(), title: "Doors open", type: "focus", durationMinutes: 10, isCustom: true },
      { id: generateId(), title: "Event opening", type: "focus", durationMinutes: 20, isCustom: true },
      { id: generateId(), title: "Pitches begin", type: "focus", durationMinutes: 45, isCustom: true },
      { id: generateId(), title: "Break & refreshments", type: "break", durationMinutes: 15, isCustom: true },
      { id: generateId(), title: "Pitches continue", type: "focus", durationMinutes: 45, isCustom: true },
      { id: generateId(), title: "Startup Programs Presentation / judges deliberate", type: "focus", durationMinutes: 5, isCustom: true },
      { id: generateId(), title: "Feedback", type: "focus", durationMinutes: 10, isCustom: true },
      { id: generateId(), title: "Networking & drinks", type: "break", durationMinutes: 60, isCustom: true }, // Includes winners announced
    ],
    commenceTime: "15:00",
    commenceDay: DAYS_OF_WEEK.indexOf("Thursday"), // Thursday, 11 Dec
    scheduleStartOption: 'custom_time',
    isRecurring: false,
    recurrenceFrequency: 'weekly', // Changed to weekly as it's a specific day of the week
    timerColors: {},
  },
];