const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');
const Category = require('../models/Category');

// Create new inquiry
exports.createInquiry = async (req, res) => {
  try {
    const { serviceId, tenderId, customerName, phone, email, address, message, serviceName: requestedService, categoryName: requestedCategory } = req.body;

    let serviceName = null;
    let tenderTitle = null;
    let categoryName = null;

    // Handle Service Inquiry
    if (serviceId) {
      const service = await Service.findById(serviceId).populate('categoryId');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      serviceName = service.name;
      categoryName = service.categoryId ? service.categoryId.name : "No Category";

      const inquiry = await Inquiry.create({
        serviceId,
        serviceName,
        tenderId: null,
        tenderTitle: null,
        categoryName,
        customerName,
        phone,
        email,
        address,
        message: message || '',
        inquiryType: 'service',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: {
          inquiryId: inquiry._id,
          serviceName: service.name,
          categoryName
        }
      });
    }
    
    // Handle Tender Inquiry
    else if (tenderId) {
      const Tender = require('../models/Tender');
      const tender = await Tender.findById(tenderId);

      if (!tender) {
        return res.status(404).json({
          success: false,
          message: 'Tender not found'
        });
      }

      tenderTitle = tender.title;
      categoryName = tender.category || "Tender";

      const inquiry = await Inquiry.create({
        serviceId: null,
        serviceName: null,
        tenderId,
        tenderTitle,
        categoryName,
        customerName,
        phone,
        email,
        address,
        message: message || '',
        inquiryType: 'tender',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        success: true,
        message: 'Tender inquiry submitted successfully',
        data: {
          inquiryId: inquiry._id,
          tenderTitle: tender.title,
          categoryName
        }
      });
    }
    
    // Handle general contact / quote inquiry
    else {
      const inquiry = await Inquiry.create({
        serviceId: null,
        serviceName: requestedService || 'General Quote',
        tenderId: null,
        tenderTitle: null,
        categoryName: requestedCategory || 'Contact',
        customerName,
        phone,
        email: email || '',
        address: address || 'Not provided',
        message: message || '',
        inquiryType: 'general',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(201).json({
        success: true,
        message: 'Contact inquiry submitted successfully',
        data: {
          inquiryId: inquiry._id,
          serviceName: inquiry.serviceName,
          categoryName: inquiry.categoryName
        }
      });
    }

  } catch (error) {
    console.error('Error creating inquiry:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting inquiry',
      error: error.message
    });
  }
};

// Get all inquiries (Admin)
exports.getAllInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const inquiries = await Inquiry.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiries',
      error: error.message
    });
  }
};

// Get inquiry by ID (Admin)
exports.getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inquiry',
      error: error.message
    });
  }
};

// Update inquiry status (Admin)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Inquiry status updated',
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inquiry status',
      error: error.message
    });
  }
};

// Get inquiry statistics (Admin)
exports.getInquiryStats = async (req, res) => {
  try {
    const total = await Inquiry.countDocuments();
    const pending = await Inquiry.countDocuments({ status: 'pending' });
    const contacted = await Inquiry.countDocuments({ status: 'contacted' });
    const completed = await Inquiry.countDocuments({ status: 'completed' });
    const cancelled = await Inquiry.countDocuments({ status: 'cancelled' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayInquiries = await Inquiry.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        contacted,
        completed,
        cancelled,
        todayInquiries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
