import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { validateFaceDescriptor } from '../utils/validators.js';
import {
  FACE_DISTANCE_THRESHOLD,
  isReliableFaceMatch,
  findClosestFace,
  findConsensusFace,
  getUserFaceDescriptors,
} from '../utils/faceMatching.js';
import { sendAttendanceConfirmationEmail } from '../utils/emailService.js';
import { getAttendanceWindow } from './settingsController.js';

const MIN_FACE_DETECTION_CONFIDENCE = Number(process.env.FACE_DETECTION_THRESHOLD || 0.5);
const isDevelopment = process.env.NODE_ENV !== 'production';

const logRecognition = (details) => {
  if (isDevelopment) console.debug('[Attendance] recognition', details);
};

const isAfterTime = (date, threshold) => {
  const [hours, minutes] = threshold.split(':').map(Number);
  return date.getHours() > hours || (date.getHours() === hours && date.getMinutes() >= minutes);
};

const minutesFor = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const markAttendance = async (req, res) => {
  try {
    const requestId = req.headers['x-attendance-session-id'] || req.headers['x-request-id'] || 'untracked';
    const {
      faceDescriptor,
      faceDescriptors,
      confidence,
      detectionConfidence,
      livenessPassed,
      detectedFaceCount,
      deviceName,
      latitude,
      longitude,
      accuracy,
    } = req.body;

    if (!Number.isInteger(detectedFaceCount) || detectedFaceCount !== 1) {
      logRecognition({ requestId, detectedFaceCount, reason: 'exactly one face is required' });
      return res.status(422).json({
        success: false,
        message: detectedFaceCount !== 1
          ? 'No face detected. Keep exactly one face clearly visible and try again.'
          : 'Multiple faces detected. Only one person may mark attendance at a time.',
      });
    }

    const descriptors = Array.isArray(faceDescriptors) && faceDescriptors.length
      ? faceDescriptors
      : [faceDescriptor];
    if (descriptors.length < 1 || descriptors.some((descriptor) => !validateFaceDescriptor(descriptor))) {
      logRecognition({ requestId, reason: 'invalid descriptor', descriptorLength: Array.isArray(faceDescriptor) ? faceDescriptor.length : 0 });
      return res.status(422).json({
        success: false,
        message: 'Invalid face descriptor. Capture a face descriptor with exactly 128 values.',
      });
    }

    if (Number(detectionConfidence ?? confidence ?? 0) < MIN_FACE_DETECTION_CONFIDENCE) {
      logRecognition({ requestId, detectionConfidence, threshold: MIN_FACE_DETECTION_CONFIDENCE, reason: 'detector confidence below threshold' });
      return res.status(422).json({ success: false, message: 'Face detection confidence is too low. Keep your face clearly visible and try again.' });
    }

    const userQuery = {
      $or: [
        { faceDescriptor: { $exists: true, $ne: null } },
        { faceDescriptors: { $exists: true, $ne: [] } },
        { faceEmbedding: { $exists: true, $ne: null } },
      ],
      isActive: true,
    };

    if (req.user.role !== 'ADMIN') {
      userQuery._id = req.user._id;
    }

    const users = await User.find(userQuery);

    const validUsers = users.filter((user) => getUserFaceDescriptors(user).length > 0);

    console.debug('[Attendance] face verification input', {
      requestId,
      authenticatedStudentId: req.user._id,
      detectedFaceCount: Number.isInteger(detectedFaceCount) ? detectedFaceCount : null,
      capturedDescriptorExists: Array.isArray(faceDescriptor),
      capturedDescriptorLength: Array.isArray(faceDescriptor) ? faceDescriptor.length : 0,
      capturedDescriptorNumeric: validateFaceDescriptor(faceDescriptor),
      registeredUserCount: validUsers.length,
      registeredDescriptorLengths: validUsers.map((user) => getUserFaceDescriptors(user).map((descriptor) => descriptor.length)),
    });

    if (!validUsers.length) {
      logRecognition({ requestId, reason: 'no registered face descriptors found' });
      return res.status(422).json({
        success: false,
        message: 'No registered faces found',
      });
    }

    const closestMatch = findConsensusFace(descriptors, validUsers);
    if (!closestMatch) {
      logRecognition({ requestId, reason: 'no comparable registered descriptor found' });
      return res.status(422).json({
        success: false,
        message: 'No valid registered face descriptors found',
      });
    }
    logRecognition({
      requestId,
      authenticatedStudentId: req.user._id,
      matchedStudentId: closestMatch.user._id,
      storedDescriptorExists: getUserFaceDescriptors(closestMatch.user).length > 0,
      storedDescriptorLengths: getUserFaceDescriptors(closestMatch.user).map((descriptor) => descriptor.length),
      capturedDescriptorLength: descriptors[0].length,
      capturedFrameCount: descriptors.length,
      detectedFaceCount: Number.isInteger(detectedFaceCount) ? detectedFaceCount : null,
      distance: Number(closestMatch.distance.toFixed(6)),
      distanceThreshold: FACE_DISTANCE_THRESHOLD,
    });
    const requiredReliableFrames = Math.max(3, Math.ceil(descriptors.length * 0.6));
    if (!isReliableFaceMatch(closestMatch.distance) || closestMatch.reliableCount < requiredReliableFrames) {
      logRecognition({ requestId, matchedStudentId: closestMatch.user._id, distance: closestMatch.distance, threshold: FACE_DISTANCE_THRESHOLD, reason: 'distance above threshold' });
      return res.status(422).json({
        success: false,
        message: 'Face not recognized. Please ensure you are registered and your face is clearly visible.',
        data: { reliableFrames: closestMatch.reliableCount, requiredFrames: requiredReliableFrames },
      });
    }

    const userId = closestMatch.user._id;

    // Check for duplicate attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      logRecognition({ requestId, matchedStudentId: userId, reason: 'duplicate attendance for today' });
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for today',
        data: {
          studentId: closestMatch.user.studentId || closestMatch.user.employeeId || null,
          time: existingAttendance.checkInTime || existingAttendance.time,
          attendance: existingAttendance,
        },
      });
    }

    // Create attendance record
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const attendanceWindow = await getAttendanceWindow();
    const currentMinutes = minutesFor(timeString.slice(0, 5));
    if (currentMinutes < minutesFor(attendanceWindow.startTime)) {
      return res.status(409).json({ success: false, message: `Attendance opens at ${attendanceWindow.startTime}.` });
    }
    if (currentMinutes >= minutesFor(attendanceWindow.absentTime)) {
      return res.status(409).json({ success: false, message: 'Attendance is closed for today. You will be marked absent automatically.' });
    }
    const arrivalMinutes = currentMinutes;
    const status = arrivalMinutes >= minutesFor(attendanceWindow.lateTime) ? 'Late' : 'Present';

    const attendance = await Attendance.create({
      userId,
      studentId: closestMatch.user.studentId || closestMatch.user.employeeId || null,
      studentName: closestMatch.user.name,
      name: closestMatch.user.name,
      rollNumber: closestMatch.user.studentId || closestMatch.user.employeeId || null,
      date: today,
      checkInTime: timeString,
      time: timeString,
      status,
      recognitionConfidence: Number(Math.max(0, 1 - (closestMatch.distance / FACE_DISTANCE_THRESHOLD)).toFixed(4)),
      faceConfidence: Number((Math.max(0, 1 - (closestMatch.distance / FACE_DISTANCE_THRESHOLD)) * 100).toFixed(2)),
      verificationMethod: 'Face Recognition',
      facePhoto: closestMatch.user.profilePhoto || closestMatch.user.faceImage || null,
      latitude,
      longitude,
      locationAddress: null,
      mapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
      faceVerified: true,
      livenessVerified: false,
      deviceInfo: deviceName || req.headers['user-agent'] || null,
      device: deviceName || req.headers['user-agent'] || null,
    });

    console.info('[Attendance] recorded', { requestId, attendanceId: attendance._id, userId, studentName: closestMatch.user.name, status, latitude, longitude, accuracy });

    sendAttendanceConfirmationEmail({
      user: closestMatch.user,
      attendance,
    }).catch((emailError) => {
      console.error('Attendance email error:', emailError.message);
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        ...attendance.toObject(),
        user: {
          name: closestMatch.user.name,
          studentId: closestMatch.user.studentId,
          employeeId: closestMatch.user.employeeId,
          profilePhoto: closestMatch.user.profilePhoto,
          className: closestMatch.user.className,
          department: closestMatch.user.department,
          recognitionConfidence: Number(Math.max(0, 1 - (closestMatch.distance / FACE_DISTANCE_THRESHOLD)).toFixed(4)),
          locationVerified: true,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
        },
      },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for today',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance',
    });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      date,
      department,
      status,
      search,
      location,
    } = req.query;

    const query = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    let attendanceRecords = await Attendance.find(query)
      .populate('userId', '-password -faceDescriptor -faceDescriptors')
      .sort({ date: -1, checkInTime: -1 });

    // Apply department and search filters after population
    if (department || search || location) {
      attendanceRecords = attendanceRecords.filter((record) => {
        const user = record.userId;
        const matchesDepartment = !department || user?.department === department;
        const matchesSearch = !search || user?.name?.toLowerCase().includes(search.toLowerCase()) || user?.email?.toLowerCase().includes(search.toLowerCase()) || user?.studentId?.includes(search) || user?.employeeId?.includes(search);
        const matchesLocation = !location || record.locationAddress?.toLowerCase().includes(location.toLowerCase());

        return matchesDepartment && matchesSearch && matchesLocation;
      });
    }

    const total = attendanceRecords.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    attendanceRecords = attendanceRecords.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: attendanceRecords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance records',
    });
  }
};

export const getAttendanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'ADMIN' && req.user._id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(query)
      .populate('userId', '-password -faceDescriptor')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get attendance by user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user attendance',
    });
  }
};

export const getOwnAttendanceHistory = async (req, res) => {
  req.params.userId = req.user._id;
  return getAttendanceByUser(req, res);
};

export const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate('userId', '-password -faceDescriptor')
      .sort({ checkInTime: -1 });

    const present = attendance.filter((a) => a.status === 'Present').length;
    const absent = attendance.filter((a) => a.status === 'Absent').length;
    const late = attendance.filter((a) => a.status === 'Late').length;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary: {
          total: attendance.length,
          present,
          absent,
          late,
        },
      },
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch today attendance',
    });
  }
};

const getAttendanceRange = async (req, res, startDate, endDate) => {
  const query = { date: { $gte: startDate, $lt: endDate } };
  if (req.user.role !== 'ADMIN') query.userId = req.user._id;
  const records = await Attendance.find(query).populate('userId', 'name studentId employeeId profilePhoto').sort({ date: 1, checkInTime: 1 });
  res.status(200).json({ success: true, data: records });
};

export const getAttendanceWeek = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return getAttendanceRange(req, res, start, end);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch weekly attendance' });
  }
};

export const getAttendanceMonth = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return getAttendanceRange(req, res, start, end);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch monthly attendance' });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    let attendance = await Attendance.find(query)
      .populate('userId', '-password -faceDescriptor');

    if (department) {
      attendance = attendance.filter((a) => a.userId.department === department);
    }

    // Calculate statistics
    const totalRecords = attendance.length;
    const present = attendance.filter((a) => a.status === 'Present').length;
    const absent = attendance.filter((a) => a.status === 'Absent').length;
    const late = attendance.filter((a) => a.status === 'Late').length;
    const averageConfidence =
      attendance.length > 0
        ? (
            attendance.reduce((sum, a) => sum + a.recognitionConfidence, 0) /
            attendance.length
          ).toFixed(4)
        : 0;

    // Group by department
    const byDepartment = {};
    attendance.forEach((a) => {
      const dept = a.userId.department || 'Unspecified';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      byDepartment[dept].total++;
      if (a.status === 'Present') byDepartment[dept].present++;
      else if (a.status === 'Absent') byDepartment[dept].absent++;
      else byDepartment[dept].late++;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRecords,
          present,
          absent,
          late,
          presentPercentage: totalRecords ? ((present / totalRecords) * 100).toFixed(2) : '0.00',
          absentPercentage: totalRecords ? ((absent / totalRecords) * 100).toFixed(2) : '0.00',
          latePercentage: totalRecords ? ((late / totalRecords) * 100).toFixed(2) : '0.00',
          averageConfidence,
        },
        byDepartment,
        records: attendance,
      },
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate report',
    });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete attendance record',
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { status, checkOutTime } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    if (status) {
      attendance.status = status;
    }

    if (checkOutTime) {
      attendance.checkOutTime = checkOutTime;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update attendance',
    });
  }
};
