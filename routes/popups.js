const express = require('express');
const multer = require('multer');
const path = require('path');
const Popup = require('../models/Popup');
const authMiddleware = require('../middleware/authMiddleware');
const { ensureUploadDir, publicUploadPath } = require('../utils/uploadStorage');
const { compressUploadedImages } = require('../utils/imageCompression');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, ensureUploadDir('popups'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `popup-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed'), false);
  }
});

const normalizePages = (value) => {
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  if (!value) return ['*'];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map(item => item.trim()).filter(Boolean);
  } catch {
    // Fall through to comma/new-line parsing.
  }

  const pages = String(value)
    .split(/[,\n]/)
    .map(item => item.trim())
    .filter(Boolean);

  return pages.length ? pages : ['*'];
};

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value === true || value === 'true';
};

const buildPayload = (body = {}, file, existing = null) => ({
  title: body.title?.trim() || '',
  image: file ? publicUploadPath('popups', file.filename) : body.image?.trim() || existing?.image || '',
  pages: normalizePages(body.pages),
  initialDelaySeconds: Math.max(Number(body.initialDelaySeconds) || 0, 0),
  showAgainAfterClose: normalizeBoolean(body.showAgainAfterClose, existing?.showAgainAfterClose || false),
  closeDelaySeconds: Math.max(Number(body.closeDelaySeconds) || 0, 0),
  whatsappMessage: body.whatsappMessage?.trim() || existing?.whatsappMessage || 'Hello Vishwakarma Build & Furnish, I am interested in your services.',
  phone: body.phone?.trim() || existing?.phone || '9416856468',
  order: Number(body.order) || 0,
  isActive: normalizeBoolean(body.isActive, existing?.isActive !== false)
});

const pageMatches = (popupPages = [], currentPath = '/') => {
  if (!popupPages.length || popupPages.includes('*')) return true;

  return popupPages.some((page) => {
    if (page === currentPath) return true;
    if (page.endsWith('/*')) return currentPath.startsWith(page.slice(0, -1));
    return false;
  });
};

router.get('/admin/list', authMiddleware, async (req, res) => {
  try {
    const data = await Popup.find({}).sort({ order: 1, createdAt: -1 });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ success: false, message: 'Error fetching popups', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const currentPath = String(req.query.path || '/');
    const popups = await Popup.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    const data = popups.filter(popup => pageMatches(popup.pages, currentPath));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ success: false, message: 'Error fetching popups', error: error.message });
  }
});

router.post('/', authMiddleware, upload.single('imageFile'), compressUploadedImages(), async (req, res) => {
  try {
    const popup = await Popup.create(buildPayload(req.body, req.file));
    res.status(201).json({ success: true, data: popup, message: 'Popup created successfully' });
  } catch (error) {
    console.error('Error creating popup:', error);
    res.status(500).json({ success: false, message: 'Error creating popup', error: error.message });
  }
});

router.put('/:id', authMiddleware, upload.single('imageFile'), compressUploadedImages(), async (req, res) => {
  try {
    const existing = await Popup.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Popup not found' });

    const popup = await Popup.findByIdAndUpdate(req.params.id, buildPayload(req.body, req.file, existing), {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: popup, message: 'Popup updated successfully' });
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ success: false, message: 'Error updating popup', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const popup = await Popup.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, data: popup, message: 'Popup deactivated successfully' });
  } catch (error) {
    console.error('Error deleting popup:', error);
    res.status(500).json({ success: false, message: 'Error deleting popup', error: error.message });
  }
});

router.post('/:id/track', async (req, res) => {
  try {
    const actionMap = {
      view: 'views',
      call: 'callClicks',
      whatsapp: 'whatsappClicks',
      close: 'closeClicks'
    };
    const field = actionMap[req.body.action];

    if (!field) {
      return res.status(400).json({ success: false, message: 'Valid tracking action is required' });
    }

    await Popup.updateOne({ _id: req.params.id }, { $inc: { [field]: 1 } });
    res.json({ success: true, message: 'Popup action tracked' });
  } catch (error) {
    console.error('Error tracking popup:', error);
    res.status(500).json({ success: false, message: 'Error tracking popup', error: error.message });
  }
});

module.exports = router;
