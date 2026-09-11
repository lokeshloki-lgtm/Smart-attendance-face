import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { sendAbsentNotificationEmail } from './emailService.js';
import { getAttendanceWindow } from '../controllers/settingsController.js';

const getClosedDate = (absentTime) => {
  const now = new Date();
  const [hours, minutes] = absentTime.split(':').map(Number);
  const closed = now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes);
  const date = new Date(now);
  if (!closed) date.setDate(date.getDate() - 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const markAbsentStudents = async (targetDate) => {
  const attendanceWindow = await getAttendanceWindow();
  const resolvedTargetDate = targetDate || getClosedDate(attendanceWindow.absentTime);
  const nextDate = new Date(resolvedTargetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const students = await User.find({
    isActive: true,
    role: { $in: ['STUDENT', 'USER', 'TEACHER'] },
  }).select('name email studentId employeeId department profilePhoto');

  let created = 0;
  for (const student of students) {
    const result = await Attendance.updateOne(
      { userId: student._id, date: { $gte: resolvedTargetDate, $lt: nextDate } },
      {
        $setOnInsert: {
          userId: student._id,
          studentId: student.studentId || student.employeeId || null,
          studentName: student.name,
          name: student.name,
          rollNumber: student.studentId || student.employeeId || null,
          date: resolvedTargetDate,
          attendanceDate: localDateKey(resolvedTargetDate),
          checkInTime: '--:--:--',
          time: '--:--:--',
          status: 'Absent',
          facePhoto: student.profilePhoto || null,
          faceVerified: false,
          livenessVerified: false,
          verificationMethod: 'Manual',
          deviceInfo: 'Automatic absence scheduler',
          device: 'Automatic absence scheduler',
          faceVerified: false,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created += 1;
      sendAbsentNotificationEmail({ user: student, date: resolvedTargetDate }).catch((error) => {
        console.error(`Absent notification failed for ${student.email}:`, error.message);
      });
    }
  }

  return { checked: students.length, created, date: localDateKey(resolvedTargetDate) };
};

export const startAbsenceScheduler = () => {
  const run = async () => {
    try {
      const result = await markAbsentStudents();
      console.log(`✓ Absence sync: ${result.created} absent record(s) created for ${result.date}`);
    } catch (error) {
      console.error('✗ Absence sync failed:', error.message);
    }
  };

  void run();
  return setInterval(run, 60 * 60 * 1000);
};
