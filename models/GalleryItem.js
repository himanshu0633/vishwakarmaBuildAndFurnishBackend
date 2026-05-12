const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gallery title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Gallery category is required'],
      trim: true,
      default: 'Workshop'
    },
    image: {
      type: String,
      required: [true, 'Gallery image is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    featured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

galleryItemSchema.index({ category: 1, isActive: 1, order: 1 });
galleryItemSchema.index({ featured: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
