import 'dotenv/config';

const parseNumber = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const latitude = parseNumber(process.env.ATTENDANCE_LOCATION_LAT);
const longitude = parseNumber(process.env.ATTENDANCE_LOCATION_LNG);
const radiusMeters = parseNumber(process.env.ATTENDANCE_RADIUS_METERS);

export const getAttendanceLocationConfig = () => ({
  configured: Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    && Number.isFinite(radiusMeters) && radiusMeters > 0,
  latitude,
  longitude,
  radiusMeters,
});

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const distanceBetweenCoordinates = (first, second) => {
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const verifyAttendanceLocation = ({ latitude: currentLatitude, longitude: currentLongitude }, config) => {
  if (!config.configured) return { configured: false, allowed: false, distanceMeters: null };
  if (!Number.isFinite(Number(currentLatitude)) || !Number.isFinite(Number(currentLongitude))) {
    return { configured: true, allowed: false, distanceMeters: null };
  }
  const distanceMeters = distanceBetweenCoordinates(
    { latitude: config.latitude, longitude: config.longitude },
    { latitude: Number(currentLatitude), longitude: Number(currentLongitude) },
  );
  return { configured: true, allowed: distanceMeters <= config.radiusMeters, distanceMeters };
};
