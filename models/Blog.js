const mongoose = require('mongoose');

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    },
    excerpt: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      trim: true
    },
    coverImage: {
      type: String,
      trim: true,
      default: ''
    },
    blogImage: {
      type: String,
      trim: true,
      default: ''
    },
    blogImages: {
      type: [String],
      default: []
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    category: {
      type: String,
      trim: true,
      default: 'Furniture'
    },
    relatedServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    seoTitle: {
      type: String,
      trim: true,
      default: ''
    },
    seoDescription: {
      type: String,
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    faq: {
      type: [
        {
          question: { type: String, trim: true, default: '' },
          answer: { type: String, trim: true, default: '' }
        }
      ],
      default: []
    },
    priceRange: {
      type: String,
      trim: true,
      default: ''
    },
    benefits: {
      type: [String],
      default: []
    },
    process: {
      type: [
        {
          title: { type: String, trim: true, default: '' },
          description: { type: String, trim: true, default: '' }
        }
      ],
      default: []
    },
    localAreas: {
      type: [String],
      default: []
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
    },
    publishedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

blogSchema.pre('validate', function buildBlogAutoFields() {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }

  if (!this.seoTitle && this.title) {
    this.seoTitle = `${this.title} | Vishwakarma Build & Furnish`;
  }

  if (!this.seoDescription) {
    const base = this.excerpt || this.content || '';
    this.seoDescription = base.slice(0, 155);
  }

  if (!this.tags?.length && this.title) {
    this.tags = [
      this.title.toLowerCase(),
      'furniture',
      'construction',
      'interior',
      'charkhi dadri'
    ];
  }

});

blogSchema.index({ isActive: 1, featured: 1, order: 1 });
blogSchema.index({ relatedServices: 1 });

module.exports = mongoose.model('Blog', blogSchema);
