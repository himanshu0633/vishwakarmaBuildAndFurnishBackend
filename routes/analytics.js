const express = require('express');
const Service = require('../models/Service');
const Partner = require('../models/Partner');
const ServiceLike = require('../models/ServiceLike');
const Lead = require('../models/Lead');
const Bill = require('../models/Bill');
const WalletTransaction = require('../models/WalletTransaction');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const [
      mostLikedServices,
      mostClickedServices,
      mostViewedPartners,
      topCategories,
      totalLeads,
      convertedLeads,
      billStats,
      cashbackPending,
      cashbackPaid,
      topPerformingPartners,
      services
    ] = await Promise.all([
      ServiceLike.aggregate([
        { $group: { _id: '$service', likes: { $sum: 1 } } },
        { $sort: { likes: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
        { $unwind: '$service' },
        { $project: { likes: 1, serviceName: '$service.name', serviceId: '$service._id' } }
      ]),
      Service.find({}).sort({ clicks: -1 }).limit(10).select('name slug clicks views'),
      Partner.find({}).sort({ views: -1 }).limit(10).select('shopName views clicks commissionPercent'),
      ServiceLike.aggregate([
        { $group: { _id: '$category', likes: { $sum: 1 } } },
        { $sort: { likes: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { likes: 1, categoryName: '$category.name', categoryId: '$category._id' } }
      ]),
      Lead.countDocuments({}),
      Lead.countDocuments({ followUpStatus: 'Converted' }),
      Bill.aggregate([
        {
          $group: {
            _id: null,
            totalBillAmount: { $sum: '$billAmount' },
            billsUploaded: { $sum: 1 }
          }
        }
      ]),
      WalletTransaction.aggregate([
        { $match: { status: { $in: ['Pending', 'Approved'] }, amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      WalletTransaction.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } }
      ]),
      Partner.aggregate([
        {
          $lookup: {
            from: 'bills',
            localField: '_id',
            foreignField: 'partner',
            as: 'bills'
          }
        },
        {
          $project: {
            shopName: 1,
            views: 1,
            clicks: 1,
            commissionPercent: 1,
            billCount: { $size: '$bills' },
            totalBillAmount: { $sum: '$bills.billAmount' }
          }
        },
        { $sort: { totalBillAmount: -1, billCount: -1, views: -1 } },
        { $limit: 10 }
      ]),
      Service.find({}).populate('categoryId', 'name slug').select('name slug views clicks categoryId')
    ]);

    const serviceWise = await Promise.all(services.map(async (service) => {
      const [likes, leads, billsUploaded] = await Promise.all([
        ServiceLike.countDocuments({ service: service._id }),
        Lead.countDocuments({ service: service._id }),
        Bill.countDocuments({
          status: { $in: ['Cashback Approved', 'Cashback Added To Wallet', 'Cashback Paid'] }
        })
      ]);

      return {
        serviceId: service._id,
        serviceName: service.name,
        category: service.categoryId,
        views: service.views,
        clicks: service.clicks,
        likes,
        leads,
        billsUploaded,
        conversionPercent: leads ? Math.round((billsUploaded / leads) * 100) : 0
      };
    }));

    res.json({
      success: true,
      data: {
        mostLikedServices,
        mostClickedServices,
        mostViewedPartners,
        topCategories,
        totalLeads,
        convertedLeads,
        totalBillAmount: billStats[0]?.totalBillAmount || 0,
        totalCashbackPending: cashbackPending[0]?.total || 0,
        totalCashbackPaid: cashbackPaid[0]?.total || 0,
        topPerformingPartners,
        serviceWise
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
});

router.post('/services/:id/view', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  res.json({ success: true, data: service });
});

router.post('/services/:id/click', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
  res.json({ success: true, data: service });
});

module.exports = router;
