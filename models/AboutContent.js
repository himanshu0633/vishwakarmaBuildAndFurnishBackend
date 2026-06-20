const mongoose = require('mongoose');

const aboutSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    kicker: {
      type: String,
      trim: true,
      default: ''
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    text: {
      type: String,
      trim: true,
      default: ''
    },
    text2: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const aboutContentSchema = new mongoose.Schema(
  {
    sections: {
      type: [aboutSectionSchema],
      default: []
    },
    workshopPhotos: {
      type: [photoSchema],
      default: []
    },
    teamPhotos: {
      type: [photoSchema],
      default: []
    },
    serviceAreas: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      trim: true,
      default: '9416856468'
    },
    location: {
      type: String,
      trim: true,
      default: 'Charkhi Dadri, Haryana'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AboutContent', aboutContentSchema);
