const mongoose = require('mongoose');

const clientExpenseSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  expenseType: {
    type: String,
    enum: ['material', 'other'],
    required: true,
    default: 'material'
  },
  // Material details
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    index: true
  },
  materialName: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0
  },
  unit: {
    type: String,
    trim: true,
    default: 'Piece'
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  materialCost: {
    type: Number,
    default: 0,
    min: 0
  },
  transportIncluded: {
    type: Boolean,
    default: false
  },
  transportCost: {
    type: Number,
    default: 0,
    min: 0
  },
  supplier: {
    type: String,
    trim: true,
    default: ''
  },
  vehicleNo: {
    type: String,
    trim: true,
    default: ''
  },

  // Other Expense title
  title: {
    type: String,
    trim: true,
    default: ''
  },

  // Total amount calculated:
  // For material: materialCost + (transportIncluded ? 0 : transportCost)
  // For other: direct expense amount
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI / Online', 'Bank Transfer', 'Cheque', 'Credit / Udhaar', 'Other'],
    default: 'Cash'
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  billImage: {
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClientExpense', clientExpenseSchema);
