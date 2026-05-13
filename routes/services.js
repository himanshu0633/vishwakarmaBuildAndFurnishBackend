// backend/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureUploadDir } = require('../utils/uploadStorage');
const { compressUploadedImages } = require('../utils/imageCompression');
const {
  getServiceById,
  getServiceBySlug,
  getServiceMediaBySlug,
  getPopularServices,
  searchServices,
  createService,
  updateService,
  deleteService,
  uploadServiceMedia,
  deleteServiceMedia,
  getAllServices  // Now this exists!
} = require('../controllers/serviceController');
const authMiddleware = require('../middleware/authMiddleware.js');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, ensureUploadDir('services'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `service-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter
});

const serviceImageUpload = upload.fields([
  { name: 'heroImageFile', maxCount: 1 },
  { name: 'imageFile', maxCount: 1 },
  { name: 'heroImage', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Public routes (no authentication required)
router.get('/popular', getPopularServices);
router.get('/search', searchServices);
router.get('/', getAllServices);
router.get('/slug/:slug/media', getServiceMediaBySlug);
router.get('/slug/:slug', getServiceBySlug);
router.get('/:id', getServiceById);  // Get single service by ID

// Admin routes (authentication required)
router.post('/', authMiddleware, serviceImageUpload, compressUploadedImages(), createService);  // Create service
router.put('/:id', authMiddleware, serviceImageUpload, compressUploadedImages(), updateService);  // Update service
router.post(
  '/:id/media',
  authMiddleware,
  upload.fields([
    { name: 'media', maxCount: 12 },
    { name: 'images', maxCount: 20 },
    { name: 'beforeImages', maxCount: 20 },
    { name: 'afterImages', maxCount: 20 },
    { name: 'videos', maxCount: 10 }
  ]),
  compressUploadedImages(),
  uploadServiceMedia
);
router.delete('/:id/media', authMiddleware, deleteServiceMedia);
router.delete('/:id', authMiddleware, deleteService);  // Delete service

module.exports = router;
