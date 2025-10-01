export interface ScheduledTimer {
  id: string;
  title: string;
  type: "focus" | "break";
  durationMinutes: number;
  isCustom: boolean;
  customTitle?: string;
}

export interface TimerContextType {
  schedule: ScheduledTimer[];
  setSchedule: (schedule: ScheduledTimer[]) => void;
  isSchedulingMode: boolean;
  setIsSchedulingMode: (isScheduling: boolean) => void;
  startSchedule: () => void;
  scheduleTitle: string;
  setScheduleTitle: (title: string) => void;
  commenceTime: string;
  setCommenceTime: (time: string) => void;
  commenceDay: number;
  setCommenceDay: (day: number) => void;
  timerIncrement: number;
  isRecurring: boolean;
  setIsRecurring: (isRecurring: boolean) => void;
  recurrenceFrequency: 'daily' | 'weekly' | 'monthly';
  setRecurrenceFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void;
}