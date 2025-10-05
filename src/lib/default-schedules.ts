import { ScheduledTimerTemplate } from "@/types/timer";

// Helper to generate unique IDs for timers within templates
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduledTimerTemplate[] = [
  {
    id: generateId(),
    title: "Pomodoro",
    schedule: [
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25 },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5 },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25 },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5 },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25 },
      { id: generateId(), title: "Short Break", type: "break", durationMinutes: 5 },
      { id: generateId(), title: "Focus", type: "focus", durationMinutes: 25 },
      { id: generateId(), title: "Long Break", type: "break", durationMinutes: 15 },
    ],
    commenceTime: "09:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'now',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: generateId(),
    title: "School Timetable",
    schedule: [
      { id: generateId(), title: "Math Class", type: "focus", durationMinutes: 50 },
      { id: generateId(), title: "Recess", type: "break", durationMinutes: 10 },
      { id: generateId(), title: "Science Lab", type: "focus", durationMinutes: 60 },
      { id: generateId(), title: "Lunch Break", type: "break", durationMinutes: 30 },
      { id: generateId(), title: "English Literature", type: "focus", durationMinutes: 45 },
      { id: generateId(), title: "Study Hall", type: "focus", durationMinutes: 40 },
    ],
    commenceTime: "08:30",
    commenceDay: 1, // Monday
    scheduleStartOption: 'custom_time',
    isRecurring: true,
    recurrenceFrequency: 'weekly',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: generateId(),
    title: "Conference",
    schedule: [
      { id: generateId(), title: "Keynote Address", type: "focus", durationMinutes: 60 },
      { id: generateId(), title: "Coffee Break", type: "break", durationMinutes: 15 },
      { id: generateId(), title: "Session 1", type: "focus", durationMinutes: 45 },
      { id: generateId(), title: "Networking Lunch", type: "break", durationMinutes: 60 },
      { id: generateId(), title: "Session 2", type: "focus", durationMinutes: 45 },
      { id: generateId(), title: "Panel Discussion", type: "focus", durationMinutes: 60 },
    ],
    commenceTime: "09:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'manual',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
  {
    id: generateId(),
    title: "Hackathon",
    schedule: [
      { id: generateId(), title: "Brainstorming", type: "focus", durationMinutes: 90 },
      { id: generateId(), title: "Team Sync", type: "break", durationMinutes: 15 },
      { id: generateId(), title: "Coding Sprint", type: "focus", durationMinutes: 120 },
      { id: generateId(), title: "Power Nap", type: "break", durationMinutes: 20 },
      { id: generateId(), title: "Feature Implementation", type: "focus", durationMinutes: 180 },
    ],
    commenceTime: "10:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'now',
    isRecurring: false,
    recurrenceFrequency: 'daily',
    timerColors: {}, // NEW: Default empty colors
  },
];