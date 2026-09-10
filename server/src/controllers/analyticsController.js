import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

export const getAnalyticsOverview = async (req, res) => {
  try {
    const allAttendance = await Attendance.find();
    const allUsers = await User.find({ isActive: true });

    const present = allAttendance.filter((a) => a.status === 'Present').length;
    const absent = allAttendance.filter((a) => a.status === 'Absent').length;
    const late = allAttendance.filter((a) => a.status === 'Late').length;
    const total = allAttendance.length;

    const presentPercentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
    const absentPercentage = total > 0 ? ((absent / total) * 100).toFixed(2) : 0;
    const latePercentage = total > 0 ? ((late / total) * 100).toFixed(2) : 0;

    const averageConfidence =
      total > 0
        ? (
            allAttendance.reduce((sum, a) => sum + a.recognitionConfidence, 0) /
            total
          ).toFixed(4)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRecords: total,
        totalUsers: allUsers.length,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        presentPercentage: parseFloat(presentPercentage),
        absentPercentage: parseFloat(absentPercentage),
        latePercentage: parseFloat(latePercentage),
        averageConfidence: parseFloat(averageConfidence),
      },
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch analytics overview',
    });
  }
};

export const getMonthlyAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const attendance = await Attendance.find({
        date: { $gte: monthStart, $lte: monthEnd },
      });

      const present = attendance.filter((a) => a.status === 'Present').length;
      const absent = attendance.filter((a) => a.status === 'Absent').length;
      const late = attendance.filter((a) => a.status === 'Late').length;

      const monthName = monthStart.toLocaleString('en-US', { month: 'short' });

      monthlyData.push({
        month: monthName,
        present,
        absent,
        late,
        total: attendance.length,
      });
    }

    res.status(200).json({
      success: true,
      year,
      data: monthlyData,
    });
  } catch (error) {
    console.error('Get monthly analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly analytics',
    });
  }
};

export const getDepartmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query).populate('userId', 'department');

    // Group by department
    const departmentData = {};

    attendance.forEach((a) => {
      const dept = a.userId?.department || 'Unspecified';

      if (!departmentData[dept]) {
        departmentData[dept] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }

      departmentData[dept].total++;

      if (a.status === 'Present') {
        departmentData[dept].present++;
      } else if (a.status === 'Absent') {
        departmentData[dept].absent++;
      } else if (a.status === 'Late') {
        departmentData[dept].late++;
      }
    });

    // Calculate percentages
    const result = Object.entries(departmentData).map(([dept, stats]) => ({
      department: dept,
      ...stats,
      presentPercentage: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) : 0,
      absentPercentage: stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(2) : 0,
      latePercentage: stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(2) : 0,
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get department analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch department analytics',
    });
  }
};

export const getUserAttendancePercentage = async (req, res) => {
  try {
    const users = await User.find({ isActive: true });

    const userStats = await Promise.all(
      users.map(async (user) => {
        const attendance = await Attendance.find({ userId: user._id });

        const present = attendance.filter((a) => a.status === 'Present').length;
        const absent = attendance.filter((a) => a.status === 'Absent').length;
        const late = attendance.filter((a) => a.status === 'Late').length;

        const percentage =
          attendance.length > 0
            ? (((present + late) / attendance.length) * 100).toFixed(2)
            : 0;

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          department: user.department,
          studentId: user.studentId,
          employeeId: user.employeeId,
          present,
          absent,
          late,
          total: attendance.length,
          attendancePercentage: parseFloat(percentage),
        };
      })
    );

    // Sort by percentage
    userStats.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

    res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error('Get user attendance percentage error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user attendance percentages',
    });
  }
};

export const getAttendanceTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const trends = [];

    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayRecords = await Attendance.find({
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      const present = dayRecords.filter((a) => a.status === 'Present').length;
      const absent = dayRecords.filter((a) => a.status === 'Absent').length;
      const late = dayRecords.filter((a) => a.status === 'Late').length;

      trends.push({
        date: date.toISOString().split('T')[0],
        present,
        absent,
        late,
        total: dayRecords.length,
      });
    }

    res.status(200).json({
      success: true,
      days: parseInt(days),
      data: trends,
    });
  } catch (error) {
    console.error('Get attendance trends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance trends',
    });
  }
};

export const getLocationAnalytics = async (req, res) => {
  try {
    const records = await Attendance.find({ latitude: { $ne: null }, longitude: { $ne: null } })
      .select('studentName date status latitude longitude locationAddress mapsLink facePhoto')
      .sort({ date: -1 })
      .limit(500);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch location analytics' });
  }
};

export const getAttendanceInsights = async (req, res) => {
  try {
    const now = new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(startDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      return res.status(400).json({ success: false, message: 'Please provide a valid attendance date range.' });
    }

    const [records, members] = await Promise.all([
      Attendance.find({ date: { $gte: startDate, $lte: endDate } }).populate('userId', 'name email studentId employeeId department').sort({ date: 1, checkInTime: 1 }),
      User.find({ isActive: true, role: { $ne: 'ADMIN' } }).select('name email studentId employeeId department'),
    ]);

    const countStatus = (items) => items.reduce((summary, record) => {
      if (record.status === 'Present') summary.present += 1;
      if (record.status === 'Absent') summary.absent += 1;
      if (record.status === 'Late') summary.late += 1;
      return summary;
    }, { present: 0, absent: 0, late: 0 });
    const totals = countStatus(records);
    const totalExpected = Math.max(members.length * (Math.floor((endDate - startDate) / 86400000) + 1), records.length);
    const attended = totals.present + totals.late;
    const percentage = totalExpected ? Number(((attended / totalExpected) * 100).toFixed(2)) : 0;
    const dateKey = (date) => date.toISOString().slice(0, 10);
    const daily = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const key = dateKey(date);
      const dayRecords = records.filter((record) => dateKey(new Date(record.date)) === key);
      daily.push({ date: key, day: date.toLocaleDateString('en-US', { weekday: 'short' }), ...countStatus(dayRecords), total: dayRecords.length });
    }

    const memberStats = members.map((member) => {
      const memberRecords = records.filter((record) => String(record.userId?._id || record.userId) === String(member._id));
      const summary = countStatus(memberRecords);
      const expected = daily.length;
      return { ...member.toObject(), ...summary, total: memberRecords.length, expected, attendancePercentage: expected ? Number((((summary.present + summary.late) / expected) * 100).toFixed(2)) : 0 };
    }).sort((a, b) => b.attendancePercentage - a.attendancePercentage);

    const lowest = [...memberStats].sort((a, b) => a.attendancePercentage - b.attendancePercentage).slice(0, 5);
    const frequentAbsences = memberStats.filter((member) => member.absent > 0).sort((a, b) => b.absent - a.absent).slice(0, 5);
    const frequentLate = memberStats.filter((member) => member.late > 0).sort((a, b) => b.late - a.late).slice(0, 5);
    const insights = [];
    if (!records.length) insights.push('No attendance records were found for this period.');
    else insights.push(`${percentage}% attendance recorded across ${members.length} active members for this period.`);
    if (frequentAbsences[0]) insights.push(`${frequentAbsences[0].name} has the most absences (${frequentAbsences[0].absent}).`);
    if (frequentLate[0]) insights.push(`${frequentLate[0].name} has the most late arrivals (${frequentLate[0].late}).`);
    if (daily.some((day) => day.total === 0)) insights.push('Some days have no attendance records; they are shown as zero rather than omitted.');

    return res.status(200).json({ success: true, data: { range: { startDate: dateKey(startDate), endDate: dateKey(endDate) }, members: members.length, totals: { ...totals, totalExpected, attendancePercentage: percentage }, daily, memberStats, highest: memberStats.slice(0, 5), lowest, frequentAbsences, frequentLate, insights } });
  } catch (error) {
    console.error('Get attendance insights error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch attendance insights' });
  }
};
