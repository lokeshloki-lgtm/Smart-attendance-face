import SystemSetting from '../models/SystemSetting.js';

const ATTENDANCE_SETTING_KEY = 'attendance-window';
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_START_TIME = process.env.ATTENDANCE_START_TIME || '00:00';
const DEFAULT_LATE_TIME = process.env.ATTENDANCE_LATE_TIME || '09:00';
const DEFAULT_ABSENT_TIME = process.env.ATTENDANCE_ABSENT_TIME || process.env.ATTENDANCE_CLOSING_TIME || '18:00';

const getMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getAttendanceSettings = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: ATTENDANCE_SETTING_KEY }).lean();
    res.json({
      success: true,
      data: {
        startTime: setting?.attendanceStartTime || DEFAULT_START_TIME,
        lateTime: setting?.attendanceLateTime || DEFAULT_LATE_TIME,
        absentTime: setting?.attendanceAbsentTime || DEFAULT_ABSENT_TIME,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to load attendance settings' });
  }
};

export const updateAttendanceSettings = async (req, res) => {
  try {
    const startTime = req.body.startTime?.trim() || DEFAULT_START_TIME;
    const lateTime = req.body.lateTime?.trim() || DEFAULT_LATE_TIME;
    const absentTime = req.body.absentTime?.trim() || req.body.endTime?.trim() || DEFAULT_ABSENT_TIME;
    if (![startTime, lateTime, absentTime].every((value) => TIME_PATTERN.test(value || ''))) {
      return res.status(400).json({ success: false, message: 'Attendance times must use HH:MM format.' });
    }
    if (!(getMinutes(startTime) < getMinutes(lateTime)
      && getMinutes(lateTime) < getMinutes(absentTime))) {
      return res.status(400).json({ success: false, message: 'Times must follow: start, late, then absent.' });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key: ATTENDANCE_SETTING_KEY },
      { key: ATTENDANCE_SETTING_KEY, attendanceStartTime: startTime, attendanceLateTime: lateTime, attendanceAbsentTime: absentTime },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, message: 'Attendance time settings updated.', data: { startTime: setting.attendanceStartTime, lateTime: setting.attendanceLateTime, absentTime: setting.attendanceAbsentTime } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update attendance settings' });
  }
};

export const getAttendanceWindow = async () => {
  const setting = await SystemSetting.findOne({ key: ATTENDANCE_SETTING_KEY }).lean();
  return {
    startTime: setting?.attendanceStartTime || DEFAULT_START_TIME,
    lateTime: setting?.attendanceLateTime || DEFAULT_LATE_TIME,
    absentTime: setting?.attendanceAbsentTime || DEFAULT_ABSENT_TIME,
  };
};
