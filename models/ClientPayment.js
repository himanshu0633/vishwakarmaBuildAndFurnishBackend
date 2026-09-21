const mongoose = require('mongoose');

const clientPaymentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  receiptNo: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI / Online', 'Bank Transfer (NEFT/RTGS)', 'Cheque', 'Other'],
    default: 'Cash'
  },
  transactionRef: {
    type: String,
    trim: true,
    default: ''
  },
  stepId: {
    type: mongoose.Schema.Types.ObjectId
  },
  stepTitle: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
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

module.exports = mongoose.model('ClientPayment', clientPaymentSchema);
