const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      required: [true, 'Popup image is required'],
      trim: true
    },
    pages: {
      type: [String],
      default: ['*']
    },
    initialDelaySeconds: {
      type: Number,
      default: 2
    },
    showAgainAfterClose: {
      type: Boolean,
      default: false
    },
    closeDelaySeconds: {
      type: Number,
      default: 60
    },
    whatsappMessage: {
      type: String,
      trim: true,
      default: 'Hello Vishwakarma Build & Furnish, I am interested in your services.'
    },
    phone: {
      type: String,
      trim: true,
      default: '9416856468'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    views: {
      type: Number,
      default: 0
    },
    callClicks: {
      type: Number,
      default: 0
    },
    whatsappClicks: {
      type: Number,
      default: 0
    },
    closeClicks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

popupSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Popup', popupSchema);
