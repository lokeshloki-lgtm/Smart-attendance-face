import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateStudentId,
  validateEmployeeId,
} from '../utils/validators.js';
export const register = async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId, studentId, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = String(role || '').trim().toUpperCase();
    const accountRole = ['TEACHER', 'STUDENT'].includes(normalizedRole) ? normalizedRole : 'STUDENT';
    const normalizedDepartment = department?.trim();
    const normalizedStudentId = studentId?.trim();
    const normalizedEmployeeId = employeeId?.trim();

    // Validation
    if (!validateName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name (2-50 characters)',
      });
    }

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    if (!normalizedDepartment) {
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    if (accountRole === 'TEACHER' && !validateEmployeeId(normalizedEmployeeId)) {
      return res.status(400).json({ success: false, message: 'A valid teacher ID is required' });
    }

    if (accountRole === 'STUDENT' && !validateStudentId(normalizedStudentId)) {
      return res.status(400).json({ success: false, message: 'A valid student ID is required' });
    }

    // Check if user exists
    const identifierQuery = accountRole === 'TEACHER'
      ? { employeeId: normalizedEmployeeId }
      : { studentId: normalizedStudentId };
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, identifierQuery],
    });
    if (existingUser) {
      const duplicateField = existingUser.email === normalizedEmail
        ? 'Email'
        : accountRole === 'TEACHER' ? 'Teacher ID' : 'Student ID';
      return res.status(409).json({
        success: false,
        message: `${duplicateField} already registered`,
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: accountRole,
      department: normalizedDepartment,
      employeeId: accountRole === 'TEACHER' ? normalizedEmployeeId : undefined,
      studentId: accountRole === 'STUDENT' ? normalizedStudentId : undefined,
      phone: phone || '',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          phone: user.phone,
          studentId: user.studentId,
          employeeId: user.employeeId,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
      const duplicateLabels = { email: 'Email', studentId: 'Student ID', employeeId: 'Teacher ID' };
      return res.status(400).json({
        success: false,
        message: `${duplicateLabels[duplicateField] || 'This value'} is already registered`,
        field: duplicateField,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Registration could not be completed. Please try again.',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account was found for that email address',
      });
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'The password is incorrect',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -faceDescriptor');

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, profileImage } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name && validateName(name)) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
};
