const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Service = require('../models/Service');
const ServiceLike = require('../models/ServiceLike');
const Lead = require('../models/Lead');
const Bill = require('../models/Bill');
const WalletTransaction = require('../models/WalletTransaction');
const PartnerReview = require('../models/PartnerReview');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { ensureUploadDir, publicUploadPath } = require('../utils/uploadStorage');
const { compressUploadedImages } = require('../utils/imageCompression');
const { toNumber } = require('../utils/requestHelpers');

const router = express.Router();

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir('marketplace')),
  filename: (req, file, cb) => cb(null, `marketplace-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image and video files are allowed'), false);
  }
});

const populateLead = (query) => query
  .populate('user', 'name mobile whatsappNumber email')
  .populate('service', 'name slug images heroImage')
  .populate('category', 'name slug');

const buildWalletSummary = async (userId) => {
  const [transactions, bills] = await Promise.all([
    WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).populate('bill', 'billAmount billNumber status'),
    Bill.find({ user: userId }).sort({ createdAt: -1 }).populate('partner', 'shopName commissionPercent')
  ]);

  const totalCashbackEarned = transactions
    .filter(item => ['Approved', 'Paid'].includes(item.status) && item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const pendingCashback = transactions
    .filter(item => item.status === 'Pending')
    .reduce((sum, item) => sum + item.amount, 0);
  const approvedCashback = transactions
    .filter(item => item.status === 'Approved')
    .reduce((sum, item) => sum + item.amount, 0);
  const paidCashback = transactions
    .filter(item => item.status === 'Paid')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const referralBonus = transactions
    .filter(item => item.type === 'Referral Bonus Added')
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    totalCashbackEarned,
    pendingCashback,
    approvedCashback,
    paidCashback,
    walletBalance: approvedCashback - paidCashback,
    referralBonus,
    withdrawalHistory: transactions.filter(item => item.type === 'Cashback Paid by Admin'),
    transactions,
    bills
  };
};

const getValidReferralStats = async (userId) => {
  const referredUsers = await User.find({ referredBy: userId }).select('name mobile whatsappNumber createdAt mobileVerified whatsappVerified emailVerified');
  const details = await Promise.all(referredUsers.map(async (user) => {
    const verifiedBill = await Bill.findOne({
      user: user._id,
      status: { $in: ['Referral Requirement Pending', 'Cashback Approved', 'Cashback Added To Wallet', 'Cashback Paid'] }
    });
    const uploadedBill = await Bill.findOne({ user: user._id });
    const isVerified = Boolean(user.emailVerified);
    const valid = Boolean(isVerified && verifiedBill);

    return {
      id: user._id,
      referredUserName: user.name,
      mobileNumber: user.mobile,
      whatsappNumber: user.whatsappNumber,
      registerDate: user.createdAt,
      billUploaded: Boolean(uploadedBill),
      billVerified: Boolean(verifiedBill),
      referralValid: valid
    };
  }));

  const validReferrals = details.filter(item => item.referralValid).length;
  return {
    totalReferrals: details.length,
    validReferrals,
    invalidOrPendingReferrals: details.length - validReferrals,
    cashbackEligible: validReferrals >= 2,
    details
  };
};

router.post('/likes', authMiddleware, requireRole('user', 'admin'), async (req, res) => {
  try {
    const { serviceId, imageUrl = '' } = req.body;
    const service = await Service.findById(serviceId).populate('categoryId', 'name slug');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    const like = await ServiceLike.findOneAndUpdate(
      { user: req.user.id, service: service._id, imageUrl },
      { user: req.user.id, service: service._id, imageUrl, category: service.categoryId?._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const lead = await Lead.create({
      user: req.user.id,
      service: service._id,
      likedImage: imageUrl,
      category: service.categoryId?._id
    });

    await Notification.create({
      role: 'admin',
      title: 'New service lead',
      message: `${service.name} liked by a user`
    });

    res.status(201).json({ success: true, data: { like, lead }, message: 'Like saved and lead created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving like', error: error.message });
  }
});

router.get('/likes/me', authMiddleware, async (req, res) => {
  const likes = await ServiceLike.find({ user: req.user.id })
    .populate('service', 'name slug heroImage images priceStarting')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: likes });
});

router.get('/leads', authMiddleware, requireRole('admin'), async (req, res) => {
  const query = req.query.followUpStatus ? { followUpStatus: req.query.followUpStatus } : {};
  const leads = await populateLead(Lead.find(query).sort({ createdAt: -1 }));
  res.json({ success: true, data: leads });
});

router.patch('/leads/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { followUpStatus, notes } = req.body;
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      followUpStatus,
      notes,
      lastFollowUpAt: new Date()
    },
    { new: true }
  );
  res.json({ success: true, data: lead });
});

router.post('/bills', authMiddleware, requireRole('user', 'admin'), upload.single('billImage'), compressUploadedImages(), async (req, res) => {
  try {
    const { partner, billAmount, billNumber, purchaseDate, remark } = req.body;
    const selectedPartner = await Partner.findById(partner);
    if (!selectedPartner || selectedPartner.status !== 'Verified') {
      return res.status(400).json({ success: false, message: 'Please select a verified partner' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Bill image is required' });
    }

    const bill = await Bill.create({
      user: req.user.id,
      partner,
      billAmount: toNumber(billAmount),
      billImage: publicUploadPath('marketplace', req.file.filename),
      billNumber,
      purchaseDate,
      remark
    });

    await Notification.create({
      user: selectedPartner.userId,
      role: 'partner',
      title: 'New bill verification',
      message: `A bill of Rs. ${bill.billAmount} is waiting for verification`
    });

    res.status(201).json({ success: true, data: bill, message: 'Bill uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading bill', error: error.message });
  }
});

router.get('/bills', authMiddleware, async (req, res) => {
  const query = {};
  if (req.user.role === 'user') query.user = req.user.id;
  if (req.query.user) query.user = req.query.user;
  if (req.query.partner) query.partner = req.query.partner;
  if (req.query.status) query.status = req.query.status;

  if (req.user.role === 'partner') {
    const partner = await Partner.findOne({ userId: req.user.id });
    query.partner = partner?._id || new mongoose.Types.ObjectId();
  }

  const bills = await Bill.find(query)
    .populate('user', 'name mobile whatsappNumber email referralCode')
    .populate('partner', 'shopName ownerName mobile whatsappNumber commissionPercent')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bills });
});

router.patch('/bills/:id/partner-verify', authMiddleware, requireRole('partner', 'admin'), async (req, res) => {
  const { approved, rejectionReason = '' } = req.body;
  const bill = await Bill.findById(req.params.id).populate('partner');
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
  if (req.user.role === 'partner' && bill.partner.userId?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not allowed' });
  }

  bill.status = approved ? 'Pending Admin Verification' : 'Partner Rejected';
  bill.partnerVerifiedAt = approved ? new Date() : undefined;
  bill.rejectionReason = rejectionReason;
  await bill.save();
  res.json({ success: true, data: bill, message: 'Partner verification updated' });
});

router.patch('/bills/:id/admin-verify', authMiddleware, requireRole('admin'), async (req, res) => {
  const { approved, cashbackAmount, rejectionReason = '' } = req.body;
  const bill = await Bill.findById(req.params.id).populate('partner user');
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  if (!approved) {
    bill.status = 'Rejected';
    bill.rejectionReason = rejectionReason;
    await bill.save();
    await WalletTransaction.create({
      user: bill.user._id,
      bill: bill._id,
      type: 'Cashback Rejected',
      amount: 0,
      status: 'Rejected',
      note: rejectionReason
    });
    return res.json({ success: true, data: bill, message: 'Bill rejected' });
  }

  const referralStats = await getValidReferralStats(bill.user._id);
  const calculatedCashback = cashbackAmount !== undefined
    ? toNumber(cashbackAmount)
    : Math.round((bill.billAmount * toNumber(bill.partner.commissionPercent)) / 100);

  bill.cashbackAmount = calculatedCashback;
  bill.adminVerifiedAt = new Date();
  bill.status = referralStats.cashbackEligible ? 'Cashback Added To Wallet' : 'Referral Requirement Pending';
  await bill.save();

  if (referralStats.cashbackEligible) {
    await WalletTransaction.create({
      user: bill.user._id,
      bill: bill._id,
      type: 'Bill Cashback Added',
      amount: calculatedCashback,
      status: 'Approved',
      note: 'Cashback approved after referral eligibility check'
    });
  }

  res.json({
    success: true,
    data: {
      bill,
      referralStats
    },
    message: referralStats.cashbackEligible
      ? 'Cashback added to wallet'
      : 'Cashback is on hold until 2 valid referrals are completed'
  });
});

router.patch('/bills/:id/payment', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status = 'Paid', note = '' } = req.body;
  const bill = await Bill.findById(req.params.id);
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  if (status === 'Paid') {
    bill.status = 'Cashback Paid';
    bill.paidAt = new Date();
    await bill.save();
    await WalletTransaction.create({
      user: bill.user,
      bill: bill._id,
      type: 'Cashback Paid by Admin',
      amount: -Math.abs(bill.cashbackAmount),
      status: 'Paid',
      note,
      paidAt: new Date()
    });
  }

  res.json({ success: true, data: bill, message: 'Payment status updated' });
});

router.get('/wallet/me', authMiddleware, async (req, res) => {
  const summary = await buildWalletSummary(req.user.id);
  res.json({ success: true, data: summary });
});

router.get('/wallet', authMiddleware, requireRole('admin'), async (req, res) => {
  const transactions = await WalletTransaction.find({})
    .populate('user', 'name mobile whatsappNumber email')
    .populate('bill', 'billAmount billNumber status cashbackAmount')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: transactions });
});

router.patch('/wallet/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status, note } = req.body;
  const transaction = await WalletTransaction.findByIdAndUpdate(
    req.params.id,
    {
      status,
      note,
      paidAt: status === 'Paid' ? new Date() : undefined
    },
    { new: true }
  );
  res.json({ success: true, data: transaction });
});

router.get('/referrals/me', authMiddleware, async (req, res) => {
  const stats = await getValidReferralStats(req.user.id);
  res.json({ success: true, data: stats });
});

router.get('/referrals', authMiddleware, requireRole('admin'), async (req, res) => {
  const users = await User.find({ role: 'user' }).select('name mobile whatsappNumber referralCode createdAt');
  const rows = await Promise.all(users.map(async (user) => ({
    user,
    ...(await getValidReferralStats(user._id))
  })));

  res.json({ success: true, data: rows });
});

router.post('/reviews', authMiddleware, requireRole('user', 'admin'), upload.single('image'), compressUploadedImages(), async (req, res) => {
  const { partner, rating, reviewText, bill } = req.body;
  const review = await PartnerReview.create({
    user: req.user.id,
    partner,
    rating: toNumber(rating),
    reviewText,
    bill: bill || undefined,
    image: req.file ? publicUploadPath('marketplace', req.file.filename) : ''
  });
  res.status(201).json({ success: true, data: review, message: 'Review submitted for admin approval' });
});

router.get('/reviews', authMiddleware, async (req, res) => {
  const query = {};
  if (req.user.role === 'user') query.user = req.user.id;
  if (req.query.partner) query.partner = req.query.partner;
  if (req.query.status) query.status = req.query.status;
  if (!req.user || req.user.role !== 'admin') query.status = 'Approved';

  const reviews = await PartnerReview.find(query)
    .populate('user', 'name')
    .populate('partner', 'shopName')
    .populate('bill', 'billAmount billNumber status')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

router.patch('/reviews/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  const review = await PartnerReview.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ success: true, data: review, message: 'Review status updated' });
});

router.get('/notifications', authMiddleware, async (req, res) => {
  const notifications = await Notification.find({
    $or: [
      { user: req.user.id },
      { role: req.user.role },
      { role: 'all' }
    ]
  }).sort({ createdAt: -1 });
  res.json({ success: true, data: notifications });
});

module.exports = router;
