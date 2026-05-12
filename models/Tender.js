const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tender title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    // enum: ['Construction', 'IT Services', 'Consultancy', 'Supply', 'Maintenance', 'Other'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  services: {
    type: [String],
    required: [true, 'At least one service is required'],
  
  },
  budget: {
    type: String,
    required: [true, 'Budget is required'],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'awarded', 'cancelled'],
    default: 'open'
  },
  pdf: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
tenderSchema.pre('save', function() {
  this.updatedAt = Date.now();
  
});

module.exports = mongoose.model('Tender', tenderSchema);