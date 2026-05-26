const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    channel: {
      type: String,
      enum: ['mobile', 'email', 'whatsapp'],
      required: true
    },
    purpose: {
      type: String,
      enum: ['register', 'login', 'verify'],
      default: 'verify'
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    usedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpToken', otpTokenSchema);
