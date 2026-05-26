const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true
    },
    billAmount: {
      type: Number,
      required: true,
      min: 0
    },
    billImage: {
      type: String,
      required: true
    },
    billNumber: {
      type: String,
      default: ''
    },
    purchaseDate: {
      type: Date,
      required: true
    },
    remark: {
      type: String,
      default: ''
    },
    cashbackAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'Pending Partner Verification',
        'Partner Verified',
        'Partner Rejected',
        'Pending Admin Verification',
        'Referral Requirement Pending',
        'Cashback Approved',
        'Cashback Added To Wallet',
        'Cashback Paid',
        'Rejected'
      ],
      default: 'Pending Partner Verification',
      index: true
    },
    partnerVerifiedAt: Date,
    adminVerifiedAt: Date,
    paidAt: Date,
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);
