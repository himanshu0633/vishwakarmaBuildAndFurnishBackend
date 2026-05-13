const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { compressUploadedImages } = require('../utils/imageCompression');
const { ensureUploadDir } = require('../utils/uploadStorage');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, ensureUploadDir('categories'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `category-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

const categoryImageUpload = upload.fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Public routes
router.get('/', categoryController.getAllCategoriesWithServices);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (you should add authentication middleware)
router.post('/', categoryImageUpload, compressUploadedImages(), categoryController.createCategory);
router.put('/:id', categoryImageUpload, compressUploadedImages(), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
