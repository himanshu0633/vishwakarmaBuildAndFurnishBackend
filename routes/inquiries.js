const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createInquiry,
  getMyInquiries,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  getInquiryStats
} = require('../controllers/inquiryController');

// Validation rules for inquiry
const inquiryValidation = [
  body('customerName').custom((val, { req }) => {
    const name = val || req.body.name;
    if (!name || name.trim().length < 3) {
      throw new Error('Name must be at least 3 characters');
    }
    return true;
  }),
  body('phone').customSanitizer(val => (val ? val.toString().replace(/\D/g, '').slice(-10) : ''))
    .matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid email address'),
  body('address').optional({ checkFalsy: true }).trim()
];

// Public routes
router.post('/', inquiryValidation, createInquiry);

// Authenticated user routes (must be defined BEFORE /:id)
router.get('/my-inquiries', authMiddleware, getMyInquiries);
router.get('/my', authMiddleware, getMyInquiries);

// Admin routes (add authentication middleware)
router.get('/', getAllInquiries);
router.get('/stats', getInquiryStats);
router.get('/:id', getInquiryById);
router.put('/:id/status', updateInquiryStatus);

module.exports = router;
