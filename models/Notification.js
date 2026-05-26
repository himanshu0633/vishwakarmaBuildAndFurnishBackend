const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'partner', 'all'],
      default: 'all'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    readAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
