import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    employeeId: {
      type: String,
      sparse: true,
    },
    studentId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'TEACHER', 'STUDENT', 'USER'],
      default: 'STUDENT',
      set: (value) => value?.toUpperCase(),
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    className: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    faceDescriptor: {
      type: [Number],
      default: null,
    },
    faceEmbedding: {
      type: [Number],
      default: null,
    },
    faceDescriptors: {
      type: [[Number]],
      default: [],
    },
    faceImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// SmartAttend keeps one reserved administrator account.
userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'ADMIN' } }
);

const User = mongoose.model('User', userSchema);

export default User;
