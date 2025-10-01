export interface ScheduledTimer {
  id: string;
  title: string;
  type: "focus" | "break";
  durationMinutes: number;
  customTitle?: string; // New: Optional custom title for the timer type button
  isCustom?: boolean;   // New: Flag to indicate if the type button has a custom title
}