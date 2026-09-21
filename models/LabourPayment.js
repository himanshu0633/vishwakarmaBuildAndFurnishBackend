const mongoose = require('mongoose');

const labourPaymentSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Payment amount must be greater than 0']
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI / Online', 'Bank Transfer', 'Cheque', 'Other'],
    default: 'Cash'
  },
  transactionRef: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  whatsappSent: {
    type: Boolean,
    default: false
  },
  whatsappSentAt: {
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

module.exports = mongoose.model('LabourPayment', labourPaymentSchema);
