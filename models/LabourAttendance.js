const mongoose = require('mongoose');

const labourAttendanceSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required'],
    index: true
  },
  labourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabourWorker',
    required: [true, 'Labour ID is required'],
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, 'Date (YYYY-MM-DD) is required'],
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'half_day', 'absent'],
    default: 'present'
  },
  units: {
    type: Number, // 1.0 for present, 0.5 for half_day, 0.0 for absent
    default: 1.0,
    min: 0,
    max: 1.0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeWage: {
    type: Number,
    default: 0,
    min: 0
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure 1 attendance record per worker per date for a given client project
labourAttendanceSchema.index({ clientId: 1, labourId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LabourAttendance', labourAttendanceSchema);
