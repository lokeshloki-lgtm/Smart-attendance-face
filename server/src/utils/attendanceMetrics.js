export const ATTENDANCE_POLICY = 'Present and Late count as attended';

export const calculateAttendancePercentage = (present, late, totalScheduledSessions) => {
  const attendedSessions = present + late;
  return totalScheduledSessions > 0
    ? Number(((attendedSessions / totalScheduledSessions) * 100).toFixed(2))
    : 0;
};