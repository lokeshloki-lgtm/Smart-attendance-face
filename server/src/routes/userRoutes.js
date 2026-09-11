import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registerFaceDescriptor,
  findUserByFaceDescriptor,
  getAttendanceStats,
  getTeacherStudents,
  getTeacherStudentAttendance,
} from '../controllers/userController.js';
import { authMiddleware, adminMiddleware, teacherMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);

// Teacher read-only directory and attendance routes
router.get('/teacher/students', authMiddleware, teacherMiddleware, getTeacherStudents);
router.get('/teacher/students/:id/attendance', authMiddleware, teacherMiddleware, getTeacherStudentAttendance);

// User-specific routes
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, adminMiddleware, updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);

// Face recognition routes
router.post(
  '/:id/face',
  authMiddleware,
  adminMiddleware,
  registerFaceDescriptor
);

router.post(
  '/face/recognize',
  authMiddleware,
  findUserByFaceDescriptor
);

// Attendance stats
router.get('/:id/stats', authMiddleware, getAttendanceStats);

export default router;
