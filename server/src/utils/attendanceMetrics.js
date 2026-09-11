export const ATTENDANCE_POLICY = 'Present and Late count as attended';

export const calculateAttendancePercentage = (present, late, totalScheduledSessions) => {
  const attendedSessions = present + late;
  if (totalScheduledSessions <= 0) return 0;
  return Math.min(100, Number(((attendedSessions / totalScheduledSessions) * 100).toFixed(2)));
};