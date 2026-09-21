const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
});

const stepSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  amountExpected: {
    type: Number,
    default: 0,
    min: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  points: [pointSchema]
});

const siteMediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  stepTitle: {
    type: String,
    trim: true,
    default: ''
  },
  caption: {
    type: String,
    trim: true,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  location: {
    type: String,
    required: [true, 'Site location/address is required'],
    trim: true
  },
  aadharNo: {
    type: String,
    trim: true,
    default: ''
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  serviceRate: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceRateUnit: {
    type: String,
    default: 'Per Sq.Ft / Lump-sum',
    trim: true
  },
  contractAmount: {
    type: Number,
    required: [true, 'Total expected contract/work amount is required'],
    min: 0
  },
  agreementImage: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'in_progress', 'completed', 'on_hold'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedEndDate: {
    type: Date
  },
  steps: [stepSchema],
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  loginPassword: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  siteMedia: [siteMediaSchema]
}, {
  timestamps: true
});

// Helper virtual for progress percentage based on checklist points
clientSchema.virtual('progressPercentage').get(function () {
  let totalPoints = 0;
  let completedPoints = 0;

  if (this.steps && this.steps.length > 0) {
    this.steps.forEach((step) => {
      if (step.points && step.points.length > 0) {
        step.points.forEach((pt) => {
          totalPoints += 1;
          if (pt.completed) completedPoints += 1;
        });
      } else {
        totalPoints += 1;
        if (step.completed) completedPoints += 1;
      }
    });
  }

  if (totalPoints === 0) return 0;
  return Math.round((completedPoints / totalPoints) * 100);
});

clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);
