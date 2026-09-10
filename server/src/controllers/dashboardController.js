import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments({ isActive: true, role: { $ne: 'ADMIN' } });
    const registeredFaceIds = await User.countDocuments({ isActive: true, role: { $ne: 'ADMIN' }, faceDescriptor: { $exists: true, $ne: null } });
    const totalAdmins = await User.countDocuments({ role: 'ADMIN', isActive: true });
    const totalUserAccounts = await User.countDocuments({
      role: { $in: ['USER', 'STUDENT', 'TEACHER'] },
      isActive: true,
    });

    // Today's attendance
    const todayAttendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    }).populate('userId', '-password -faceDescriptor');

    const presentToday = todayAttendance.filter((a) => a.status === 'Present').length;
    const absentToday = todayAttendance.filter((a) => a.status === 'Absent').length;
    const lateToday = todayAttendance.filter((a) => a.status === 'Late').length;
    const attendancePercentage = totalUsers > 0 ? Number((((presentToday + lateToday) / totalUsers) * 100).toFixed(2)) : 0;

    // Average attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendance = await Attendance.find({
      date: { $gte: thirtyDaysAgo },
    });

    const presentRecent = recentAttendance.filter((a) => a.status === 'Present').length;
    const absentRecent = recentAttendance.filter((a) => a.status === 'Absent').length;
    const lateRecent = recentAttendance.filter((a) => a.status === 'Late').length;

    const averageAttendance =
      recentAttendance.length > 0
        ? (((presentRecent + lateRecent) / recentAttendance.length) * 100).toFixed(2)
        : 0;

    // Department-wise stats
    const allUsers = await User.find({ isActive: true, role: { $ne: 'ADMIN' } }).select('department');
    const departmentStats = {};

    allUsers.forEach((user) => {
      const dept = user.department || 'Unspecified';
      if (!departmentStats[dept]) {
        departmentStats[dept] = 0;
      }
      departmentStats[dept]++;
    });

    const departmentAttendance = {};
    todayAttendance.forEach((record) => {
      const department = record.userId?.department || 'Unspecified';
      if (!departmentAttendance[department]) departmentAttendance[department] = { present: 0, absent: 0, late: 0 };
      if (record.status === 'Present') departmentAttendance[department].present += 1;
      if (record.status === 'Absent') departmentAttendance[department].absent += 1;
      if (record.status === 'Late') departmentAttendance[department].late += 1;
    });

    // Recent attendance records
    const recentRecords = await Attendance.find()
      .populate('userId', '-password -faceDescriptor')
      .sort({ date: -1, checkInTime: -1 })
      .limit(10);

    // Daily attendance for last 7 days
    const dailyAttendance = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayRecords = await Attendance.countDocuments({
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      const dayPresent = await Attendance.countDocuments({
        date: {
          $gte: date,
          $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
        status: 'Present',
      });

      dailyAttendance.push({
        date: date.toISOString().split('T')[0],
        total: dayRecords,
        present: dayPresent,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          registeredFaceIds,
          totalAdmins,
          totalUserAccounts,
          presentToday,
          absentToday,
          lateToday,
          averageAttendance: parseFloat(averageAttendance),
          attendancePercentage,
        },
        recentAttendance: recentRecords,
        dailyAttendance,
        departmentStats,
        departmentAttendance,
        systemStatus: 'Operational',
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard data',
    });
  }
};

export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password -faceDescriptor');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // All-time stats
    const allAttendance = await Attendance.find({ userId });
    const presentAll = allAttendance.filter((a) => a.status === 'Present').length;
    const absentAll = allAttendance.filter((a) => a.status === 'Absent').length;
    const lateAll = allAttendance.filter((a) => a.status === 'Late').length;

    const percentageAll =
      allAttendance.length > 0
        ? (((presentAll + lateAll) / allAttendance.length) * 100).toFixed(2)
        : 0;

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthAttendance = await Attendance.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    });

    const presentMonth = monthAttendance.filter((a) => a.status === 'Present').length;
    const absentMonth = monthAttendance.filter((a) => a.status === 'Absent').length;
    const lateMonth = monthAttendance.filter((a) => a.status === 'Late').length;

    const percentageMonth =
      monthAttendance.length > 0
        ? (((presentMonth + lateMonth) / monthAttendance.length) * 100).toFixed(2)
        : 0;

    // Today's status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecord = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const monthRecords = await Attendance.find({ userId, date: { $gte: monthStart, $lt: monthEnd } });
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekRecords = await Attendance.find({ userId, date: { $gte: weekStart, $lt: weekEnd } });
    const summarizeDay = (records, date) => {
      const key = date.toISOString().split('T')[0];
      const matching = records.filter((record) => record.date.toISOString().split('T')[0] === key);
      return { date: key, day: date.toLocaleDateString('en-US', { weekday: 'short' }), present: matching.filter((record) => record.status === 'Present').length, absent: matching.filter((record) => record.status === 'Absent').length, late: matching.filter((record) => record.status === 'Late').length };
    };
    const currentWeek = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return summarizeDay(weekRecords, date);
    });
    const currentMonth = Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, index) => summarizeDay(monthRecords, new Date(today.getFullYear(), today.getMonth(), index + 1)));
    const currentMonthSummary = currentMonth.reduce((summary, day) => ({ present: summary.present + day.present, absent: summary.absent + day.absent, late: summary.late + day.late }), { present: 0, absent: 0, late: 0 });
    const currentMonthTotal = currentMonthSummary.present + currentMonthSummary.absent + currentMonthSummary.late;

    // Recent attendance
    const recentAttendance = await Attendance.find({ userId })
      .sort({ date: -1 })
      .limit(10);

    // Monthly chart data
    const monthlyChart = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRecords = await Attendance.find({
        userId,
        date: { $gte: monthStart, $lte: monthEnd },
      });

      const monthPresent = monthRecords.filter((a) => a.status === 'Present').length;

      monthlyChart.push({
        month: monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        present: monthPresent,
        total: monthRecords.length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: user,
        stats: {
          allTime: {
            total: allAttendance.length,
            present: presentAll,
            absent: absentAll,
            late: lateAll,
            percentage: parseFloat(percentageAll),
          },
          lastThirtyDays: {
            total: monthAttendance.length,
            present: presentMonth,
            absent: absentMonth,
            late: lateMonth,
            percentage: parseFloat(percentageMonth),
          },
          todayStatus: todayRecord ? {
            marked: true,
            status: todayRecord.status,
            checkInTime: todayRecord.checkInTime,
            faceVerified: todayRecord.faceVerified,
          } : {
            marked: false,
          },
        },
        recentAttendance,
        monthlyChart,
        currentMonth: { year: today.getFullYear(), month: today.getMonth(), days: currentMonth, summary: currentMonthSummary, percentage: currentMonthTotal ? Number((((currentMonthSummary.present + currentMonthSummary.late) / currentMonthTotal) * 100).toFixed(2)) : 0 },
        currentWeek,
      },
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user dashboard',
    });
  }
};
