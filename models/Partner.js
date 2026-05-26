const mongoose = require('mongoose');

const partnerProductSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: {
      type: String,
      trim: true,
      default: ''
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const partnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    shopName: {
      type: String,
      required: true,
      trim: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    whatsappNumber: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    shopAddress: {
      type: String,
      required: true,
      trim: true
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      address: String
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categoryName: {
      type: String,
      trim: true
    },
    productsServices: {
      type: [String],
      default: []
    },
    productImages: {
      type: [String],
      default: []
    },
    products: {
      type: [partnerProductSchema],
      default: []
    },
    commissionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    shopImages: {
      type: [String],
      default: []
    },
    gstNumber: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected', 'Blocked'],
      default: 'Pending',
      index: true
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Partner', partnerSchema);
