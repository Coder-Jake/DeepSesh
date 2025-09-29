export interface ScheduledTimer {
  id: string;
  title: string;
  type: 'focus' | 'break';
  durationMinutes: number;
}