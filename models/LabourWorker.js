const mongoose = require('mongoose');

const labourWorkerSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Labour/Worker name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: [
      'mistri',
      'mazdoor',
      'thekedar',
      'carpenter',
      'plumber',
      'electrician',
      'painter',
      'helper',
      'other'
    ],
    default: 'mazdoor'
  },
  dailyWage: {
    type: Number,
    required: [true, 'Daily wage (दिहाड़ी) is required'],
    min: [0, 'Daily wage cannot be negative'],
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LabourWorker', labourWorkerSchema);
