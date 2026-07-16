const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true,
      default: ''
    },
    answer: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const mediaSeoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      required: true
    },
    field: {
      type: String,
      trim: true,
      default: 'images'
    },
    type: {
      type: String,
      trim: true,
      default: 'image'
    },
    alt: {
      type: String,
      trim: true,
      default: ''
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    caption: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    shortDescription: {
      type: String,
      default: ''
    },
    fullDescription: {
      type: String,
      default: ''
    },
    emoji: {
      type: String,
      default: '🔧'
    },
    heroImage: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    beforeImages: {
      type: [String],
      default: []
    },
    afterImages: {
      type: [String],
      default: []
    },
    videos: {
      type: [String],
      default: []
    },
    mediaSeo: {
      type: [mediaSeoSchema],
      default: []
    },
    popular: {
      type: Boolean,
      default: false
    },
    featured: {
      type: Boolean,
      default: false
    },
    priceStarting: {
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
    tags: {
      type: [String],
      default: []
    },
    features: {
      type: [String],
      default: []
    },
    relatedServices: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service'
        }
      ],
      default: []
    },
    faq: {
      type: [faqSchema],
      default: []
    },
    order: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

serviceSchema.pre('validate', function() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('Service', serviceSchema);
