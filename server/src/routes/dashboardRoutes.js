import express from 'express';
import {
  getAdminDashboard,
  getUserDashboard,
} from '../controllers/dashboardController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', authMiddleware, adminMiddleware, getAdminDashboard);
router.get('/user', authMiddleware, getUserDashboard);

export default router;
