import User from '../models/User.js';
import { validateFaceDescriptor } from '../utils/validators.js';
import {
  calculateFaceDistance,
  FACE_DUPLICATE_THRESHOLD,
  getUserFaceDescriptors,
} from '../utils/faceMatching.js';

export const registerOwnFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!validateFaceDescriptor(faceDescriptor)) {
      return res.status(422).json({
        success: false,
        message: 'faceDescriptor must contain exactly 128 finite numbers',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'Active user not found' });
    }
    if (getUserFaceDescriptors(user).length > 0) {
      return res.status(409).json({
        success: false,
        message: `Face already registered to Student ID: ${user.studentId || user.employeeId || user._id}`,
      });
    }

    const otherUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { faceDescriptor: { $exists: true, $ne: null } },
        { faceDescriptors: { $exists: true, $ne: [] } },
        { faceEmbedding: { $exists: true, $ne: null } },
      ],
      isActive: true,
    }).select('faceDescriptor faceDescriptors faceEmbedding');

    const duplicateFace = otherUsers.some(
      (otherUser) => getUserFaceDescriptors(otherUser).some((registered) => (
        validateFaceDescriptor(registered)
        && calculateFaceDistance(faceDescriptor, registered) <= FACE_DUPLICATE_THRESHOLD
      ))
    );

    if (duplicateFace) {
      return res.status(409).json({
        success: false,
        message: 'This face is already registered to another active user',
      });
    }

    user.faceDescriptor = faceDescriptor;
    user.faceEmbedding = faceDescriptor;
    user.faceDescriptors = [faceDescriptor];
    await user.save();

    console.info('[Face] descriptor registered', {
      userId: user._id,
      descriptorExists: true,
      descriptorLength: faceDescriptor.length,
      descriptorNumeric: faceDescriptor.every((value) => typeof value === 'number' && Number.isFinite(value)),
    });

    return res.status(200).json({
      success: true,
      message: 'Face registered successfully',
      data: {
        userId: user._id,
        name: user.name,
        studentId: user.studentId,
        faceRegistered: true,
      },
    });
  } catch (error) {
    console.error('Register own face error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to register face',
    });
  }
};
