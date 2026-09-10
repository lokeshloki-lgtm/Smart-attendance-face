import express from 'express';
import { registerOwnFace } from '../controllers/faceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authMiddleware, registerOwnFace);

export default router;
