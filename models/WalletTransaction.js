const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill'
    },
    referralUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: [
        'Bill Cashback Added',
        'Referral Bonus Added',
        'Cashback Paid by Admin',
        'Cashback Rejected'
      ],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
      default: 'Pending'
    },
    note: {
      type: String,
      default: ''
    },
    paidAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
