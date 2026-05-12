const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const tenderController = require('../controllers/tenderController');
const authMiddleware = require('../middleware/authMiddleware'); // Your existing auth middleware

// Configure multer for PDF upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/tenders/';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `tender-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Public routes (no authentication required)
router.get('/', tenderController.getAllTenders);
router.get('/stats', tenderController.getTenderStats);
router.get('/:id', tenderController.getTenderById);
router.get('/:id/download', tenderController.downloadPDF);

// Protected routes (require authentication)
// For admin-only routes, you'll need to add role check in controller or create admin middleware
router.post('/', authMiddleware, upload.single('pdf'), tenderController.createTender);
router.put('/:id', authMiddleware, upload.single('pdf'), tenderController.updateTender);
router.put('/:id/status', authMiddleware, tenderController.updateTenderStatus);
router.delete('/:id', authMiddleware, tenderController.deleteTender);

module.exports = router;