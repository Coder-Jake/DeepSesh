import { ScheduledTimerTemplate, ScheduledTimer } from "@/types/timer"; // NEW: Import ScheduledTimer
import { DAYS_OF_WEEK } from "@/lib/constants"; // NEW: Import DAYS_OF_WEEK from constants

// Helper to generate unique IDs for timers within templates
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduledTimerTemplate[] = [
  {
    id: "default-pomodoro", // Stable ID
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
    commenceDay: null, // Today (default)
    scheduleStartOption: 'now',
    isRecurring: true, // MODIFIED: Set to true for Pomodoro
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: "default-school-timetable", // Stable ID
    title: "School Timetable",
    schedule: [
      { id: generateId(), title: "Mathematics", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Math" }, // MODIFIED: 60 minutes
      { id: generateId(), title: "Economics", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Economics" }, // NEW: Added Economics
      { id: generateId(), title: "Recess", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Recess" }, // MODIFIED: 15 minutes
      { id: generateId(), title: "Science Lab", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Science Lab" },
      { id: generateId(), title: "PE", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "PE" }, // NEW: Added PE
      { id: generateId(), title: "Lunch", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Lunch" },
      { id: generateId(), title: "English Literature", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "English Literature" },
      { id: generateId(), title: "Music", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Music" }, // MODIFIED: Changed from Study Hall to Music and 45 mins
    ],
    commenceTime: "08:30",
    commenceDay: DAYS_OF_WEEK.indexOf("Monday"), // Monday
    scheduleStartOption: 'custom_time',
    isRecurring: false, // MODIFIED: Set to false for School Timetable
    recurrenceFrequency: 'weekly',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: "default-conference", // Stable ID
    title: "Conference",
    schedule: [
      { id: generateId(), title: "Keynote Address", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Keynote Address" },
      { id: generateId(), title: "Coffee Break", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Coffee Break" },
      { id: generateId(), title: "Session 1", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 1" },
      { id: generateId(), title: "Networking Lunch", type: "break", durationMinutes: 60, isCustom: true, customTitle: "Networking Lunch" },
      { id: generateId(), title: "Session 2", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 2" },
      { id: generateId(), title: "Q&A submissions", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Q&A submissions" }, // MODIFIED: Changed to 'break'
      { id: generateId(), title: "Panel Discussion", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Panel Discussion" },
      { id: generateId(), title: "Afterparty", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Afterparty" }, // NEW: Added Afterparty
    ],
    commenceTime: "09:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'manual',
    isRecurring: false, // MODIFIED: Set to false for Conference
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: "default-hackathon", // Stable ID
    title: "Hackathon",
    schedule: [
      { id: generateId(), title: "Mission & Assignment", type: "focus", durationMinutes: 20, isCustom: true, customTitle: "Mission & Assignment" }, // NEW: Added Mission & Assignment
      { id: generateId(), title: "Team Sync", type: "break", durationMinutes: 10, isCustom: true, customTitle: "Team Sync" }, // MODIFIED: Duration changed to 10 mins
      { id: generateId(), title: "Brainstorming", type: "focus", durationMinutes: 90, isCustom: true, customTitle: "Brainstorming" }, // MOVED: After Team Sync
      { id: generateId(), title: "Pizza", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Pizza" }, // NEW: Added Pizza break
      { id: generateId(), title: "Coding Sprint", type: "focus", durationMinutes: 120, isCustom: true, customTitle: "Coding Sprint" },
      { id: generateId(), title: "Power Nap", type: "break", durationMinutes: 20, isCustom: true, customTitle: "Power Nap" },
      { id: generateId(), title: "Feature Implementation", type: "focus", durationMinutes: 180, isCustom: true, customTitle: "Feature Implementation" },
    ],
    commenceTime: "10:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'now',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
];