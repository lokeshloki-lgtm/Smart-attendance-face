import express from 'express';
import {
  markAttendance,
  getAllAttendance,
  getAttendanceByUser,
  getTodayAttendance,
  getAttendanceReport,
  deleteAttendance,
  updateAttendance,
  getOwnAttendanceHistory,
  getAttendanceWeek,
  getAttendanceMonth,
} from '../controllers/attendanceController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { attendanceLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Mark attendance (for all authenticated users)
router.post('/mark', attendanceLimiter, authMiddleware, markAttendance);

// Current user's saved attendance history
router.get('/history', authMiddleware, getOwnAttendanceHistory);

// Get all attendance (admin only)
router.get('/', authMiddleware, adminMiddleware, getAllAttendance);

// Get today's attendance
router.get('/today', authMiddleware, getTodayAttendance);
router.get('/week', authMiddleware, getAttendanceWeek);
router.get('/month', authMiddleware, getAttendanceMonth);

// Get attendance report (admin only)
router.get('/report', authMiddleware, adminMiddleware, getAttendanceReport);

// Get user's attendance
router.get('/user/:userId', authMiddleware, getAttendanceByUser);

// Update attendance (admin only)
router.put('/:id', authMiddleware, adminMiddleware, updateAttendance);

// Delete attendance (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, deleteAttendance);

export default router;
