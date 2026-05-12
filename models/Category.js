const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true
    },
    // Kept only to satisfy/remove old databases that still have a unique category_1 index.
    category: {
      type: String,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    description: {
      type: String,
      default: ''
    },
    emoji: {
      type: String,
      default: '📦'
    },
    icon: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    seoTitle: {
      type: String,
      default: ''
    },
    seoDescription: {
      type: String,
      default: ''
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

categorySchema.pre('validate', function() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  this.category = this.name;

  if (!this.icon && this.emoji) {
    this.icon = this.emoji;
  }
});

module.exports = mongoose.model('Category', categorySchema);
