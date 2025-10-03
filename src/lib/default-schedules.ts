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
    isRecurring: false,
    recurrenceFrequency: 'daily',
  },
  {
    id: generateId(),
    title: "School Timetable",
    schedule: [
      { id: generateId(), title: "Math Class", type: "focus", durationMinutes: 50, isCustom: true, customTitle: "Math Class" },
      { id: generateId(), title: "Recess", type: "break", durationMinutes: 10, isCustom: true, customTitle: "Recess" },
      { id: generateId(), title: "Science Lab", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Science Lab" },
      { id: generateId(), title: "Lunch Break", type: "break", durationMinutes: 30, isCustom: true, customTitle: "Lunch Break" },
      { id: generateId(), title: "English Literature", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "English Literature" },
      { id: generateId(), title: "Study Hall", type: "focus", durationMinutes: 40, isCustom: true, customTitle: "Study Hall" },
    ],
    commenceTime: "08:30",
    commenceDay: 1, // Monday
    scheduleStartOption: 'custom_time',
    isRecurring: true,
    recurrenceFrequency: 'weekly',
  },
  {
    id: generateId(),
    title: "Conference",
    schedule: [
      { id: generateId(), title: "Keynote Address", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Keynote Address" },
      { id: generateId(), title: "Coffee Break", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Coffee Break" },
      { id: generateId(), title: "Session 1", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 1" },
      { id: generateId(), title: "Networking Lunch", type: "break", durationMinutes: 60, isCustom: true, customTitle: "Networking Lunch" },
      { id: generateId(), title: "Session 2", type: "focus", durationMinutes: 45, isCustom: true, customTitle: "Session 2" },
      { id: generateId(), title: "Panel Discussion", type: "focus", durationMinutes: 60, isCustom: true, customTitle: "Panel Discussion" },
    ],
    commenceTime: "09:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'manual',
    isRecurring: false,
    recurrenceFrequency: 'daily',
  },
  {
    id: generateId(),
    title: "Hackathon",
    schedule: [
      { id: generateId(), title: "Brainstorming", type: "focus", durationMinutes: 90, isCustom: true, customTitle: "Brainstorming" },
      { id: generateId(), title: "Team Sync", type: "break", durationMinutes: 15, isCustom: true, customTitle: "Team Sync" },
      { id: generateId(), title: "Coding Sprint", type: "focus", durationMinutes: 120, isCustom: true, customTitle: "Coding Sprint" },
      { id: generateId(), title: "Power Nap", type: "break", durationMinutes: 20, isCustom: true, customTitle: "Power Nap" },
      { id: generateId(), title: "Feature Implementation", type: "focus", durationMinutes: 180, isCustom: true, customTitle: "Feature Implementation" },
    ],
    commenceTime: "10:00",
    commenceDay: null, // Today (default)
    scheduleStartOption: 'now',
    isRecurring: false,
    recurrenceFrequency: 'daily',
  },
];