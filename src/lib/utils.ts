import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define the mapping from index to visibility options
export const VISIBILITY_OPTIONS_MAP = [
  ['public'], // Index 0: Green
  ['friends'], // Index 1: Blue
  ['organisation'], // Index 2: Red
  ['friends', 'organisation'], // Index 3: Purple
  ['private'], // Index 4: Gray
];

// Helper to get the index from a visibility array
export const getIndexFromVisibility = (visibility: ('public' | 'friends' | 'organisation' | 'private')[] | null): number => {
  if (!visibility || visibility.length === 0) return 0; // Default to public if not set

  const sortedVisibility = [...visibility].sort().join(','); // Ensure consistent order for comparison

  for (let i = 0; i < VISIBILITY_OPTIONS_MAP.length; i++) {
    const mapEntry = [...VISIBILITY_OPTIONS_MAP[i]].sort().join(',');
    if (sortedVisibility === mapEntry) {
      return i;
    }
  }
  return 0; // Default to public if no match
};

// Helper function to determine the privacy color class from an index
export const getPrivacyColorClassFromIndex = (index: number): string => {
  const labelColors = ["text-green-700", "text-blue-500", "text-red-500", "text-purple-500", "text-gray-500"];
  return labelColors[index % labelColors.length];
};

// HSL values for interpolation
// blue-500: hsl(210 100% 50%)
// purple-600: hsl(270 100% 50%)
// black: hsl(0 0% 0%)
const BLUE_500_HSL = { h: 210, s: 100, l: 50 };
const PURPLE_600_HSL = { h: 270, s: 100, l: 50 };
const BLACK_HSL = { h: 0, s: 0, l: 0 };

export const getSociabilityColor = (sociability: number): string => {
  // Clamp sociability between 0 and 100
  const clampedSociability = Math.max(0, Math.min(100, sociability));

  let h, s, l;

  if (clampedSociability <= 50) {
    // Transition from BLUE_500 to BLACK (0% to 50%)
    const ratio = clampedSociability / 50; // 0 at 0%, 1 at 50%
    h = BLUE_500_HSL.h + (BLACK_HSL.h - BLUE_500_HSL.h) * ratio;
    s = BLUE_500_HSL.s + (BLACK_HSL.s - BLUE_500_HSL.s) * ratio;
    l = BLUE_500_HSL.l + (BLACK_HSL.l - BLUE_500_HSL.l) * ratio;
  } else {
    // Transition from BLACK to PURPLE_600 (50% to 100%)
    const ratio = (clampedSociability - 50) / 50; // 0 at 50%, 1 at 100%
    h = BLACK_HSL.h + (PURPLE_600_HSL.h - BLACK_HSL.h) * ratio;
    s = BLACK_HSL.s + (PURPLE_600_HSL.s - BLACK_HSL.s) * ratio;
    l = BLACK_HSL.l + (PURPLE_600_HSL.l - BLACK_HSL.l) * ratio;
  }

  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
};