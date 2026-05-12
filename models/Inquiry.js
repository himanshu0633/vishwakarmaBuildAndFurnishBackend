const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  // Service fields
  serviceId: {
    type: String,
    default: null
  },
  serviceName: {
    type: String,
    default: null
  },
  
  // Tender fields
  tenderId: {
    type: String,
    default: null
  },
  tenderTitle: {
    type: String,
    default: null
  },
  inquiryType: {
  type: String,
  enum: ['service', 'tender', 'general'],
  required: true
},
  // Common fields
  categoryName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    match: [/^$|^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  address: {
    type: String,
    default: '',
    trim: true,
  },
  message: {
    type: String,
    default: '',
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  inquiryType: {
    type: String,
    enum: ['service', 'tender', 'general'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'completed', 'cancelled'],
    default: 'pending'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inquiry', inquirySchema);
