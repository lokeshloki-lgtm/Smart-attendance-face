import bcryptjs from 'bcryptjs';
import User from './models/User.js';

export const DEFAULT_ADMIN = {
  name: 'SmartAttend Administrator',
  email: 'admin@smartattend.com',
  password: 'Admin@123456',
  role: 'ADMIN',
  department: 'Administration',
  employeeId: 'ADMIN001',
  phone: '',
  isActive: true,
};

const ensureDefaultAdmin = async () => {
  const normalizedEmail = DEFAULT_ADMIN.email.toLowerCase();
  const passwordHash = await bcryptjs.hash(DEFAULT_ADMIN.password, 12);
  const existingAdmin = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!existingAdmin) {
    await User.create({
      ...DEFAULT_ADMIN,
      email: normalizedEmail,
      password: passwordHash,
    });
    console.log(`✓ Default admin created: ${normalizedEmail}`);
    return;
  }

  // Keep the reserved account active and aligned with the documented credentials.
  existingAdmin.name = DEFAULT_ADMIN.name;
  existingAdmin.role = DEFAULT_ADMIN.role;
  existingAdmin.department = DEFAULT_ADMIN.department;
  existingAdmin.employeeId = DEFAULT_ADMIN.employeeId;
  existingAdmin.isActive = true;

  const passwordMatches = await bcryptjs.compare(DEFAULT_ADMIN.password, existingAdmin.password);
  if (!passwordMatches) existingAdmin.password = passwordHash;

  await existingAdmin.save();
  console.log(`✓ Default admin ready: ${normalizedEmail}`);
};

export default ensureDefaultAdmin;
