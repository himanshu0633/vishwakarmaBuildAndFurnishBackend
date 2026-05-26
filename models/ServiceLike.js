const mongoose = require('mongoose');

const serviceLikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  },
  { timestamps: true }
);

serviceLikeSchema.index({ user: 1, service: 1, imageUrl: 1 }, { unique: true });

module.exports = mongoose.model('ServiceLike', serviceLikeSchema);
