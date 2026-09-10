import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from './src/models/User.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('✓ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@smartattend.com' });

    if (existingAdmin) {
      console.log('✓ Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default admin user
    const adminPassword = 'Admin@123456';
    const hashedPassword = await bcryptjs.hash(adminPassword, 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartattend.com',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Administration',
      employeeId: 'ADMIN001',
      phone: '+1-800-000-0000',
      isActive: true,
    });

    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@smartattend.com');
    console.log('  Password: Admin@123456');
    console.log('  Note: Change the password after first login');

    // Create a sample user for testing
    const sampleUserPassword = 'User@123456';
    const hashedUserPassword = await bcryptjs.hash(sampleUserPassword, 10);

    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedUserPassword,
      role: 'USER',
      department: 'IT',
      studentId: 'STU001',
      phone: '+1-234-567-8900',
      isActive: true,
    });

    console.log('✓ Sample user created successfully');
    console.log('  Email: john@example.com');
    console.log('  Password: User@123456');

    console.log('\n✓ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
