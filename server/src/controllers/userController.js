import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { validateFaceDescriptor, validateStudentId, validateEmployeeId } from '../utils/validators.js';
import {
  calculateFaceDistance,
  FACE_DISTANCE_THRESHOLD,
  FACE_DUPLICATE_THRESHOLD,
  calculateFaceConfidence,
  findClosestFace,
  findConsensusFace,
  getUserFaceDescriptors,
  isReliableFaceMatch,
} from '../utils/faceMatching.js';
import { saveProfilePhoto } from '../utils/profilePhoto.js';

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const serializeAttendance = (record) => ({
  ...record.toObject(),
  attendanceDate: record.attendanceDate || localDateKey(record.date),
});

export const getTeacherStudents = async (req, res) => {
  try {
    const { search, department, sort = 'name', order = 'asc' } = req.query;
    const query = { isActive: true, role: { $in: ['STUDENT', 'USER'] } };
    if (department && department !== 'all') query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSorts = { name: 'name', rollNumber: 'studentId', course: 'className', department: 'department', joined: 'createdAt' };
    const sortField = allowedSorts[sort] || 'name';
    const direction = order === 'desc' ? -1 : 1;
    const students = await User.find(query)
      .select('-password -faceDescriptor -faceDescriptors -faceEmbedding')
      .sort({ [sortField]: direction, _id: 1 })
      .lean();

    const studentIds = students.map((student) => student._id);
    const attendance = await Attendance.find({ userId: { $in: studentIds } }).select('userId status date attendanceDate');
    const statsByUser = new Map();
    attendance.forEach((record) => {
      const key = String(record.userId);
      const stats = statsByUser.get(key) || { present: 0, late: 0, absent: 0, total: 0 };
      if (record.status === 'Present') stats.present += 1;
      if (record.status === 'Late') stats.late += 1;
      if (record.status === 'Absent') stats.absent += 1;
      stats.total += 1;
      statsByUser.set(key, stats);
    });

    const data = students.map((student) => {
      const stats = statsByUser.get(String(student._id)) || { present: 0, late: 0, absent: 0, total: 0 };
      return {
        ...student,
        attendance: {
          ...stats,
          percentage: stats.total ? Number((((stats.present + stats.late) / stats.total) * 100).toFixed(2)) : 0,
        },
      };
    });

    res.status(200).json({ success: true, data, departments: [...new Set(students.map((student) => student.department).filter(Boolean))].sort() });
  } catch (error) {
    console.error('Get teacher students error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teacher student directory' });
  }
};

export const getTeacherStudentAttendance = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, isActive: true, role: { $in: ['STUDENT', 'USER'] } })
      .select('-password -faceDescriptor -faceDescriptors -faceEmbedding')
      .lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const records = await Attendance.find({ userId: student._id }).sort({ date: -1, checkInTime: -1 });
    const summary = records.reduce((result, record) => {
      result[record.status.toLowerCase()] += 1;
      return result;
    }, { present: 0, late: 0, absent: 0 });
    const total = records.length;
    res.status(200).json({
      success: true,
      data: {
        student,
        summary: { ...summary, total, percentage: total ? Number((((summary.present + summary.late) / total) * 100).toFixed(2)) : 0 },
        records: records.map(serializeAttendance),
      },
    });
  } catch (error) {
    console.error('Get teacher student attendance error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch student attendance' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, department, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (department) {
      query.department = department;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password -faceDescriptor')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch users',
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password -faceDescriptor -faceDescriptors -faceEmbedding -faceImage');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user',
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, studentId, department, className, phone, profilePhoto, faceDescriptor, faceDescriptors, faceImage } = req.body;
    const normalizedStudentId = studentId?.trim();
    const normalizedEmployeeId = employeeId?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const accountRole = String(role || 'STUDENT').trim().toUpperCase();
    const descriptors = Array.isArray(faceDescriptors) && faceDescriptors.length
      ? faceDescriptors
      : faceDescriptor ? [faceDescriptor] : [];

    // Check if user exists
    const identifier = accountRole === 'TEACHER' ? normalizedEmployeeId : normalizedStudentId;
    const identifierQuery = accountRole === 'TEACHER' ? { employeeId: identifier } : { studentId: identifier };
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, ...(identifier ? [identifierQuery] : [])] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === normalizedEmail
          ? 'Email already exists'
          : accountRole === 'TEACHER'
            ? `Teacher ID ${normalizedEmployeeId} is already registered`
            : `Student ID ${normalizedStudentId} is already registered`,
      });
    }

    if (accountRole === 'STUDENT' && !validateStudentId(normalizedStudentId)) {
      return res.status(400).json({ success: false, message: 'A valid student ID is required' });
    }

    if (accountRole === 'TEACHER' && !validateEmployeeId(normalizedEmployeeId)) {
      return res.status(400).json({ success: false, message: 'A valid teacher ID is required' });
    }

    if (descriptors.length && (descriptors.length < 1 || descriptors.some((descriptor) => !validateFaceDescriptor(descriptor)))) {
      return res.status(422).json({ success: false, message: 'Face could not be detected clearly. Capture exactly one valid face.' });
    }

    if (descriptors.length) {
      const registeredUsers = await User.find({
        isActive: true,
        $or: [
          { faceDescriptor: { $exists: true, $ne: null } },
          { faceDescriptors: { $exists: true, $ne: [] } },
          { faceEmbedding: { $exists: true, $ne: null } },
        ],
      }).select('studentId faceDescriptor faceDescriptors faceEmbedding');
      const duplicateOwner = registeredUsers.find((registeredUser) => descriptors.some((descriptor) => (
        getUserFaceDescriptors(registeredUser).some((registered) => calculateFaceDistance(descriptor, registered) <= FACE_DUPLICATE_THRESHOLD)
      )));

      if (duplicateOwner) {
        return res.status(409).json({
          success: false,
          message: `Face already registered to Student ID: ${duplicateOwner.studentId || 'another active user'}`,
          data: { studentId: duplicateOwner.studentId || null },
        });
      }
    }

    const hashedPassword = await bcryptjs.hash(password || 'DefaultPassword123', 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: accountRole,
      employeeId: accountRole === 'TEACHER' ? normalizedEmployeeId : undefined,
      studentId: accountRole === 'STUDENT' ? normalizedStudentId : undefined,
      department,
      className,
      phone,
      profilePhoto: await saveProfilePhoto(profilePhoto),
      faceDescriptor: descriptors[0] || null,
      faceEmbedding: descriptors[0] || null,
      faceDescriptors: descriptors,
      faceImage: faceImage || null,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'identifier';
      return res.status(409).json({ success: false, message: `${duplicateField} is already registered` });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, phone, department, className, role, studentId, employeeId, profilePhoto, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (className !== undefined) user.className = className;
    if (role) user.role = role;
    if (studentId !== undefined) user.studentId = studentId;
    if (employeeId !== undefined) user.employeeId = employeeId;
    if (isActive !== undefined) user.isActive = isActive;
    if (profilePhoto !== undefined) user.profilePhoto = await saveProfilePhoto(profilePhoto);

    await user.save();

    const safeUser = await User.findById(req.params.id).select('-password -faceDescriptor -faceDescriptors -faceEmbedding -faceImage');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safeUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete user's attendance records
    await Attendance.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
};

export const registerFaceDescriptor = async (req, res) => {
  try {
    const { faceDescriptor, faceDescriptors, faceImage, profilePhoto } = req.body;
    const descriptors = Array.isArray(faceDescriptors) && faceDescriptors.length
      ? faceDescriptors
      : [faceDescriptor];

    if (descriptors.length < 1 || descriptors.some((descriptor) => !validateFaceDescriptor(descriptor))) {
      return res.status(422).json({
        success: false,
        message: 'Invalid face descriptor format',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const otherUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { faceDescriptor: { $exists: true, $ne: null } },
        { faceDescriptors: { $exists: true, $ne: [] } },
        { faceEmbedding: { $exists: true, $ne: null } },
      ],
      isActive: true,
    }).select('studentId faceDescriptor faceDescriptors faceEmbedding');

    console.debug('[Face] admin descriptor registration attempt', {
      userId: user._id,
      descriptorExists: true,
      descriptorLength: descriptors[0].length,
      descriptorCount: descriptors.length,
    });

    const duplicateFace = otherUsers.some(
      (otherUser) => descriptors.some((descriptor) => {
        const registeredDescriptors = getUserFaceDescriptors(otherUser);
        return registeredDescriptors.some((registered) => validateFaceDescriptor(registered)
          && calculateFaceDistance(descriptor, registered) <= FACE_DUPLICATE_THRESHOLD);
      })
    );

    if (duplicateFace) {
      return res.status(409).json({
        success: false,
        message: `Face already registered to Student ID: ${otherUsers.find((otherUser) => getUserFaceDescriptors(otherUser).some((registered) => descriptors.some((descriptor) => calculateFaceDistance(descriptor, registered) <= FACE_DUPLICATE_THRESHOLD)))?.studentId || 'another active user'}`,
      });
    }

    user.faceDescriptor = descriptors[0];
    user.faceEmbedding = descriptors[0];
    user.faceDescriptors = descriptors;
    if (faceImage) user.faceImage = faceImage;
    if (profilePhoto) user.profilePhoto = await saveProfilePhoto(profilePhoto);
    await user.save();

    console.info('[Face] admin descriptor saved', {
      userId: user._id,
      descriptorLength: user.faceDescriptor?.length,
      descriptorCount: user.faceDescriptors?.length,
      embeddingSaved: Array.isArray(user.faceEmbedding) && user.faceEmbedding.length === 128,
    });

    res.status(200).json({
      success: true,
      message: 'Face descriptor registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        faceRegistered: !!user.faceDescriptor,
        samples: descriptors.length,
      },
    });
  } catch (error) {
    console.error('Register face descriptor error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register face descriptor',
    });
  }
};

export const findUserByFaceDescriptor = async (req, res) => {
  try {
    const descriptors = Array.isArray(req.body.faceDescriptors) && req.body.faceDescriptors.length
      ? req.body.faceDescriptors
      : [req.body.faceDescriptor];

    if (descriptors.length < 1 || descriptors.some((descriptor) => !validateFaceDescriptor(descriptor))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid face descriptor format',
      });
    }

    const query = {
      $or: [
        { faceDescriptor: { $exists: true, $ne: null } },
        { faceDescriptors: { $exists: true, $ne: [] } },
        { faceEmbedding: { $exists: true, $ne: null } },
      ],
      isActive: true,
    };

    if (req.user.role !== 'ADMIN') {
      query._id = req.user._id;
    }

    const users = await User.find(query).select('-password -faceDescriptor -faceDescriptors -faceEmbedding -faceImage');

    const validUsers = users.filter((user) => getUserFaceDescriptors(user).length > 0);

    if (!validUsers.length) {
      return res.status(422).json({
        success: false,
        message: 'No registered faces found',
      });
    }

    const closestMatch = findConsensusFace(descriptors, validUsers);
    const confidence = calculateFaceConfidence(closestMatch.distance);

    const requiredReliableFrames = Math.max(3, Math.ceil(descriptors.length * 0.6));
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[FACE MATCH]', {
        capturedDescriptorLength: descriptors[0].length,
        capturedFrameCount: descriptors.length,
        registeredStudentCount: validUsers.length,
        candidates: validUsers.map((candidate) => {
          const candidateMatch = findClosestFace(descriptors[0], [candidate]);
          return {
            studentId: candidate.studentId || candidate.employeeId || String(candidate._id),
            distance: Number(candidateMatch.distance.toFixed(6)),
            confidence: Number((calculateFaceConfidence(candidateMatch.distance) * 100).toFixed(2)),
          };
        }),
        bestCandidate: closestMatch.user.studentId || closestMatch.user.employeeId || String(closestMatch.user._id),
        averageDistance: Number(closestMatch.distance.toFixed(6)),
        threshold: FACE_DISTANCE_THRESHOLD,
        reliableFrames: closestMatch.reliableCount,
        requiredFrames: requiredReliableFrames,
        decision: isReliableFaceMatch(closestMatch.distance) && closestMatch.reliableCount >= requiredReliableFrames ? 'PASS' : 'FAIL',
      });
    }
    if (!isReliableFaceMatch(closestMatch.distance) || closestMatch.reliableCount < requiredReliableFrames) {
      return res.status(422).json({
        success: false,
        message: 'Face not recognized',
        confidence: 0,
        data: { distance: Number(closestMatch.distance.toFixed(4)), minimumDistance: FACE_DISTANCE_THRESHOLD, reliableFrames: closestMatch.reliableCount, requiredFrames: requiredReliableFrames },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Face recognized successfully',
      data: {
        user: {
          _id: closestMatch.user._id,
          name: closestMatch.user.name,
          email: closestMatch.user.email,
          studentId: closestMatch.user.studentId,
          employeeId: closestMatch.user.employeeId,
          department: closestMatch.user.department,
          className: closestMatch.user.className,
        },
        confidence: Number((confidence * 100).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Find user by face error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recognize face',
    });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allTimeAttendance = await Attendance.find({ userId });
    const monthAttendance = await Attendance.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    });

    const presentAll = allTimeAttendance.filter((a) => a.status === 'Present').length;
    const absentAll = allTimeAttendance.filter((a) => a.status === 'Absent').length;
    const lateAll = allTimeAttendance.filter((a) => a.status === 'Late').length;

    const percentageAll =
      allTimeAttendance.length > 0
        ? ((presentAll + lateAll) / allTimeAttendance.length) * 100
        : 0;

    const presentMonth = monthAttendance.filter((a) => a.status === 'Present').length;
    const absentMonth = monthAttendance.filter((a) => a.status === 'Absent').length;
    const lateMonth = monthAttendance.filter((a) => a.status === 'Late').length;

    const percentageMonth =
      monthAttendance.length > 0
        ? ((presentMonth + lateMonth) / monthAttendance.length) * 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        allTime: {
          total: allTimeAttendance.length,
          present: presentAll,
          absent: absentAll,
          late: lateAll,
          percentage: percentageAll.toFixed(2),
        },
        lastThirtyDays: {
          total: monthAttendance.length,
          present: presentMonth,
          absent: absentMonth,
          late: lateMonth,
          percentage: percentageMonth.toFixed(2),
        },
        recentAttendance: allTimeAttendance.slice(-10).reverse(),
      },
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch attendance stats',
    });
  }
};
