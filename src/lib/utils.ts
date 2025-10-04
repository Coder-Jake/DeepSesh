import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getNearestNextHourTime(): string {
  const now = new Date();
  const currentMinutes = now.getMinutes();
  let nextHour = now.getHours();

  // If current minutes are past 30, round up to the next hour
  if (currentMinutes > 30) {
    nextHour = (nextHour + 1) % 24; // Increment hour, wrap around at 24
  }

  // Format to HH:00
  const formattedHour = nextHour.toString().padStart(2, '0');
  return `${formattedHour}:00`;
}