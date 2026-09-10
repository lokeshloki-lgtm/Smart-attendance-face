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
} from '../controllers/userController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);

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
