// Function to convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param lat1 Latitude of point 1 (in degrees)
 * @param lon1 Longitude of point 1 (in degrees)
 * @param lat2 Latitude of point 2 (in degrees)
 * @param lon2 Longitude of point 2 (in degrees)
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
};

/**
 * Formats a distance in meters into a human-readable string (meters or kilometers).
 * Returns "Unknown distance" if the distance is null or undefined.
 * @param distance Distance in meters (or null/undefined)
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number | null | undefined): string => {
  if (distance === null || distance === undefined) return "Unknown distance";
  if (distance < 1000) {
    return `~${Math.round(distance)}m`;
  } else {
    return `~${(distance / 1000).toFixed(1)}km`;
  }
};