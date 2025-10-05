import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines whether a given hex color is light or dark and returns a contrasting text color (black or white).
 * Uses the WCAG luminance formula.
 * @param hexcolor The hex color string (e.g., "#RRGGBB" or "#RGB").
 * @returns "#000000" for light backgrounds, "#FFFFFF" for dark backgrounds.
 */
export function getContrastingTextColor(hexcolor: string): string {
  // Remove '#' if present
  const hex = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;

  // Convert 3-digit hex to 6-digit hex
  const fullHex = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;

  // Parse R, G, B values
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Calculate luminance (WCAG formula)
  // For the purposes of determining contrasting text, we can use a simplified luminance calculation.
  // A common heuristic is to sum the RGB values or use a weighted average.
  // A more accurate method involves converting to sRGB and then to linear RGB, then calculating luminance.
  // For simplicity and common UI needs, a weighted average is often sufficient.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use a threshold to decide between black and white text
  // A common threshold is 0.5, but it can be adjusted.
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}