import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user ID'],
    },
    studentId: {
      type: String,
      trim: true,
      default: null,
    },
    studentName: {
      type: String,
      trim: true,
      required: [true, 'Please provide student name'],
    },
    name: { type: String, trim: true, default: null },
    rollNumber: { type: String, trim: true, default: null },
    date: {
      type: Date,
      required: [true, 'Please provide date'],
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    checkInTime: {
      type: String,
      required: [true, 'Please provide check-in time'],
    },
    time: {
      type: String,
      default: null,
    },
    checkOutTime: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent'],
      default: 'Present',
    },
    recognitionConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    faceConfidence: { type: Number, min: 0, max: 100, default: null },
    facePhoto: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null,
    },
    mapsLink: {
      type: String,
      default: null,
    },
    locationAddress: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    livenessVerified: { type: Boolean, default: false },
    verificationMethod: {
      type: String,
      enum: ['Face Recognition', 'Manual'],
      default: 'Face Recognition',
    },
    deviceInfo: {
      type: String,
      default: null,
    },
    device: { type: String, default: null },
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

// Indexes for efficient queries
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // Prevent duplicate attendance same day

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
