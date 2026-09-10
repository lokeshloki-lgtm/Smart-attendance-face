import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import faceRoutes from './routes/faceRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { FACE_DISTANCE_THRESHOLD } from './utils/faceMatching.js';
import { getAttendanceLocationConfig } from './utils/location.js';

import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const currentFile = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFile), '..');

app.use('/uploads', express.static(path.join(serverRoot, 'uploads')));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:5176',
      ];

      const configuredOrigin = process.env.CLIENT_URL;
      if (configuredOrigin) allowedOrigins.push(configuredOrigin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Attendance-Session-Id'],
    exposedHeaders: ['Retry-After', 'RateLimit', 'RateLimit-Policy'],
  })
);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartAttend API is running',
    healthCheck: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

app.get('/api/health/config', (req, res) => {
  const location = getAttendanceLocationConfig();
  res.status(200).json({
    success: true,
    data: {
      attendanceRoute: 'POST /api/attendance/mark',
      recognitionRoute: 'POST /api/users/face/recognize',
      faceDistanceThreshold: FACE_DISTANCE_THRESHOLD,
      attendanceGeofenceConfigured: location.configured,
      attendanceRadiusMeters: location.radiusMeters,
    },
  });
});

// 404 handler
app.use(notFoundMiddleware);

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;
