const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  getInquiryStats
} = require('../controllers/inquiryController');

// Validation rules for inquiry
const inquiryValidation = [
  body('customerName').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('address').optional({ checkFalsy: true }).trim()
];

// Public routes
router.post('/', inquiryValidation, createInquiry);

// Admin routes (add authentication middleware)
router.get('/', getAllInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiryById);
router.put('/:id/status', updateInquiryStatus);

module.exports = router;
