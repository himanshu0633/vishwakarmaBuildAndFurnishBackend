const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    likedImage: {
      type: String,
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    followUpStatus: {
      type: String,
      enum: ['New Lead', 'Contacted', 'Interested', 'Not Interested', 'Converted'],
      default: 'New Lead',
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    lastFollowUpAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
