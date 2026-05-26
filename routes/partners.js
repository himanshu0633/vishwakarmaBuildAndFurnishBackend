const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Partner = require('../models/Partner');
const User = require('../models/User');
const Service = require('../models/Service');
const PartnerReview = require('../models/PartnerReview');
const Bill = require('../models/Bill');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ensureUploadDir, publicUploadPath } = require('../utils/uploadStorage');
const { compressUploadedImages } = require('../utils/imageCompression');
const { toArray, toNumber } = require('../utils/requestHelpers');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir('partners')),
  filename: (req, file, cb) => cb(null, `partner-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image and video files are allowed'), false);
  }
});

const router = express.Router();

const createToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const getFiles = (req, field) => (req.files?.[field] || [])
  .map(file => publicUploadPath('partners', file.filename));

const parseLocation = (value) => {
  if (!value) return undefined;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return { address: value.toString() };
  }
};

router.post(
  '/register',
  upload.fields([
    { name: 'productImages', maxCount: 10 },
    { name: 'shopImages', maxCount: 10 }
  ]),
  compressUploadedImages(),
  async (req, res) => {
    try {
      const {
        shopName,
        ownerName,
        mobile,
        whatsappNumber,
        email,
        password,
        shopAddress,
        category,
        categoryName,
        currentLocation,
        commissionPercent,
        gstNumber
      } = req.body;

      if (!shopName || !ownerName || !mobile || !email || !password || !shopAddress) {
        return res.status(400).json({
          success: false,
          message: 'Shop name, owner name, mobile, email, password and shop address are required'
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user already exists with this email'
        });
      }

      const user = await User.create({
        name: ownerName,
        mobile,
        whatsappNumber,
        email,
        address: shopAddress,
        password,
        role: 'partner',
        mobileVerified: false,
        whatsappVerified: false,
        emailVerified: false
      });

      const partner = await Partner.create({
        userId: user._id,
        shopName,
        ownerName,
        mobile,
        whatsappNumber,
        email,
        shopAddress,
        currentLocation: parseLocation(currentLocation),
        category: category || undefined,
        categoryName,
        productsServices: toArray(req.body.productsServices),
        productImages: getFiles(req, 'productImages'),
        commissionPercent: toNumber(commissionPercent),
        shopImages: getFiles(req, 'shopImages'),
        gstNumber
      });

      res.status(201).json({
        success: true,
        message: 'Partner registration submitted for admin verification',
        token: createToken(user),
        data: partner
      });
    } catch (error) {
      console.error('Partner register error:', error);
      res.status(500).json({ success: false, message: 'Error registering partner', error: error.message });
    }
  }
);

router.get('/', async (req, res) => {
  try {
    const query = req.query.includePending === 'true' ? {} : { status: 'Verified' };
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.$or = [{ category: req.query.category }, { categoryName: req.query.category }];

    const partners = await Partner.find(query)
      .populate('category', 'name slug')
      .sort({ status: 1, createdAt: -1 });

    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching partners', error: error.message });
  }
});

router.get('/me', authMiddleware, requireRole('partner'), async (req, res) => {
  const partner = await Partner.findOne({ userId: req.user.id }).populate('category', 'name slug');
  res.json({ success: true, data: partner });
});

router.get('/dashboard/summary', authMiddleware, requireRole('partner'), async (req, res) => {
  const partner = await Partner.findOne({ userId: req.user.id });
  if (!partner) return res.status(404).json({ success: false, message: 'Partner profile not found' });

  const [pendingBills, verifiedBills, rejectedBills, reviews] = await Promise.all([
    Bill.countDocuments({ partner: partner._id, status: 'Pending Partner Verification' }),
    Bill.countDocuments({ partner: partner._id, status: { $in: ['Partner Verified', 'Pending Admin Verification', 'Cashback Approved', 'Cashback Added To Wallet', 'Cashback Paid'] } }),
    Bill.countDocuments({ partner: partner._id, status: { $in: ['Partner Rejected', 'Rejected'] } }),
    PartnerReview.find({ partner: partner._id }).sort({ createdAt: -1 }).limit(10)
  ]);

  res.json({
    success: true,
    data: {
      partner,
      stats: {
        pendingBills,
        verifiedBills,
        rejectedBills,
        views: partner.views,
        clicks: partner.clicks
      },
      reviews
    }
  });
});

router.get('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Suppress invalid token error for public view
      }
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('category', 'name slug');

    if (!partner || (partner.status !== 'Verified' && (!user || user.role !== 'admin'))) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const reviews = await PartnerReview.find({ partner: partner._id, status: 'Approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { partner, reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching partner', error: error.message });
  }
});

router.post('/:id/click', async (req, res) => {
  const partner = await Partner.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
  res.json({ success: true, data: partner });
});

router.patch('/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { status, rejectionReason = '' } = req.body;
    if (!['Pending', 'Verified', 'Rejected', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid partner status' });
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rejectionReason,
        verifiedAt: status === 'Verified' ? new Date() : undefined,
        verifiedBy: status === 'Verified' ? req.user.id : undefined
      },
      { new: true }
    );

    res.json({ success: true, data: partner, message: 'Partner status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating partner status', error: error.message });
  }
});

router.post('/:id/services', authMiddleware, requireRole('partner', 'admin'), async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
  if (req.user.role !== 'admin' && partner.userId?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not allowed' });
  }

  partner.productsServices = toArray(req.body.productsServices);
  await partner.save();
  res.json({ success: true, data: partner });
});

router.post(
  '/:id/products',
  authMiddleware,
  requireRole('partner', 'admin'),
  upload.single('image'),
  compressUploadedImages(),
  async (req, res) => {
    try {
      const partner = await Partner.findById(req.params.id);
      if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
      if (req.user.role !== 'admin' && partner.userId?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not allowed' });
      }

      const { service, name, description } = req.body;
      if (!service || !name) {
        return res.status(400).json({ success: false, message: 'Service and product name are required' });
      }

      const selectedService = await Service.findById(service).select('name');
      if (!selectedService) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      partner.products.push({
        service,
        serviceName: selectedService.name,
        name,
        description,
        image: req.file ? publicUploadPath('partners', req.file.filename) : ''
      });

      if (!partner.productsServices.includes(selectedService.name)) {
        partner.productsServices.push(selectedService.name);
      }

      await partner.save();
      res.status(201).json({ success: true, data: partner, message: 'Product added successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error adding product', error: error.message });
    }
  }
);

router.delete('/:id/products/:productId', authMiddleware, requireRole('partner', 'admin'), async (req, res) => {
  const partner = await Partner.findById(req.params.id);
  if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
  if (req.user.role !== 'admin' && partner.userId?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not allowed' });
  }

  partner.products = partner.products.filter(product => product._id.toString() !== req.params.productId);
  await partner.save();
  res.json({ success: true, data: partner, message: 'Product removed' });
});

module.exports = router;
