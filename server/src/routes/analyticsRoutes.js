import express from 'express';
import {
  getAnalyticsOverview,
  getMonthlyAnalytics,
  getDepartmentAnalytics,
  getUserAttendancePercentage,
  getAttendanceTrends,
  getLocationAnalytics,
  getAttendanceInsights,
} from '../controllers/analyticsController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', authMiddleware, adminMiddleware, getAnalyticsOverview);
router.get('/monthly', authMiddleware, adminMiddleware, getMonthlyAnalytics);
router.get('/department', authMiddleware, adminMiddleware, getDepartmentAnalytics);
router.get(
  '/user-percentage',
  authMiddleware,
  adminMiddleware,
  getUserAttendancePercentage
);
router.get('/trends', authMiddleware, adminMiddleware, getAttendanceTrends);
router.get('/locations', authMiddleware, adminMiddleware, getLocationAnalytics);
router.get('/attendance-insights', authMiddleware, adminMiddleware, getAttendanceInsights);

export default router;
