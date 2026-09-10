import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { getAttendanceSettings, updateAttendanceSettings } from '../controllers/settingsController.js';

const router = express.Router();
router.use(authMiddleware, adminMiddleware);
router.get('/attendance', getAttendanceSettings);
router.put('/attendance', updateAttendanceSettings);

export default router;
