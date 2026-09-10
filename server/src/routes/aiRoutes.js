import express from 'express';
import { chatWithAI, generateAttendanceSummary } from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', authMiddleware, chatWithAI);
router.get('/summary', authMiddleware, generateAttendanceSummary);

export default router;
