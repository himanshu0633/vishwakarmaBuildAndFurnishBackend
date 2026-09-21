const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Civil & Masonry',
      'Steel & Iron',
      'Wood & Ply',
      'Tiles & Stone',
      'Paint & Putty',
      'Plumbing',
      'Electrical',
      'Hardware & Fittings',
      'Other'
    ],
    default: 'Civil & Masonry'
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    default: 'Piece'
  },
  defaultPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  defaultSupplier: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('Material', materialSchema);
