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

// NEW: Helper function to calculate dynamic focusPreference gradient colors
export const getSociabilityGradientColor = (focusPreference: number): string => { // Changed from sociability
  const clampedFocusPreference = Math.max(0, Math.min(100, focusPreference)); // Changed from sociability
  const saturation = 90; // Fixed saturation
  const minLightness = 10; // Minimum lightness value

  if (clampedFocusPreference > 50) { // Changed from sociability
    // Purpleish gradient for Deep Focus: H=260, L from minLightness (at 50%) to 50% (at 100%)
    const lightness = minLightness + (clampedFocusPreference - 50) * ((50 - minLightness) / 50); // Changed from sociability
    return `hsl(260 ${saturation}% ${lightness}%)`;
  } else if (clampedFocusPreference < 50) { // Changed from sociability
    // Blueish gradient for Banter: H=220, L from minLightness (at 50%) to 50% (at 0%)
    const lightness = minLightness + (50 - clampedFocusPreference) * ((50 - minLightness) / 50); // Changed from sociability
    return `hsl(220 ${saturation}% ${lightness}%)`;
  } else {
    // Exactly 50%, lightness is minLightness. Use the purpleish hue as a default for the midpoint.
    return `hsl(260 ${saturation}% ${minLightness}%)`;
  }
};