import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import ensureDefaultAdmin from './seedAdmin.js';
import { startAbsenceScheduler } from './utils/absenceService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Database connected');

    await ensureDefaultAdmin();
    const absenceScheduler = startAbsenceScheduler();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API URL: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${PORT} is already in use!`);
        console.error(`Another terminal or process is already running the backend server on port ${PORT}.`);
        console.error(`You do not need to run 'npm run dev' again in a second terminal.\n`);
      } else {
        console.error('✗ Server error:', err.message);
      }
      process.exit(1);
    });

    process.once('SIGINT', () => clearInterval(absenceScheduler));
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Server shutting down gracefully...');
  process.exit(0);
});
