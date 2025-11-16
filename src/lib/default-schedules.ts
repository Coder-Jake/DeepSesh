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
];