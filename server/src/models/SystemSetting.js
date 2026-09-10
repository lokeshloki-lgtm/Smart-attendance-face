import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  attendanceStartTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  attendanceLateTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  attendanceAbsentTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
}, { timestamps: true });

export default mongoose.model('SystemSetting', systemSettingSchema);
