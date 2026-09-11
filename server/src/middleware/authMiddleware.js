import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select('_id name email role isActive department studentId employeeId profileImage profilePhoto');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (String(req.user?.role || '').trim().toUpperCase() !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

export const teacherMiddleware = (req, res, next) => {
  if (String(req.user?.role || '').trim().toUpperCase() !== 'TEACHER') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher privileges required.',
    });
  }
  next();
};

export const userMiddleware = (req, res, next) => {
  if (!['USER', 'STUDENT', 'TEACHER'].includes(String(req.user?.role || '').toUpperCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User privileges required.',
    });
  }
  next();
};
