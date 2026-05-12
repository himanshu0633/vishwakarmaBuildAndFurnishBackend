const Tender = require('../models/Tender');
const fs = require('fs');
const path = require('path');

// Create a new tender with PDF upload
exports.createTender = async (req, res) => {
  try {
    let { title, category, description, location, budget, deadline, status, services } = req.body;
    
    // Handle services - parse if it's a string
    let servicesArray = [];
    if (services) {
      // If services is a string, try to parse it as JSON
      if (typeof services === 'string') {
        try {
          servicesArray = JSON.parse(services);
        } catch (e) {
          // If parsing fails, treat as single service
          servicesArray = [services];
        }
      } else if (Array.isArray(services)) {
        servicesArray = services;
      } else {
        servicesArray = [services];
      }
    }
    
    // Handle PDF file upload
    let pdfData = null;
    if (req.file) {
      pdfData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }
    
    const tender = new Tender({
      title,
      category,
      description,
      location,
      budget,
      deadline,
      services: servicesArray,
      status: status || 'open',
      pdf: pdfData,
      createdBy: req.user.id
    });
    
    await tender.save();
    
    // Populate services before sending response
    const populatedTender = await Tender.findById(tender._id).populate('services', 'name slug shortDescription emoji');
    
    res.status(201).json({
      success: true,
      message: 'Tender created successfully',
      data: populatedTender
    });
  } catch (error) {
    console.error('Error creating tender:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create tender'
    });
  }
};

// Get all tenders with filters
exports.getAllTenders = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tenders = await Tender.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('services', 'name slug shortDescription emoji');
    
    const total = await Tender.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: tenders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tenders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenders'
    });
  }
};

// Get single tender by ID
exports.getTenderById = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('services', 'name slug shortDescription emoji');
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tender
    });
  } catch (error) {
    console.error('Error fetching tender:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tender'
    });
  }
};

// Update tender
exports.updateTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }
    
    // Handle services - parse if it's a string
    if (req.body.services) {
      let servicesArray = [];
      if (typeof req.body.services === 'string') {
        try {
          servicesArray = JSON.parse(req.body.services);
        } catch (e) {
          servicesArray = [req.body.services];
        }
      } else if (Array.isArray(req.body.services)) {
        servicesArray = req.body.services;
      } else {
        servicesArray = [req.body.services];
      }
      req.body.services = servicesArray;
    }
    
    // Handle PDF update
    if (req.file) {
      if (tender.pdf && tender.pdf.path) {
        fs.unlink(tender.pdf.path, (err) => {
          if (err) console.error('Error deleting old PDF:', err);
        });
      }
      
      req.body.pdf = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
    }
    
    const updatedTender = await Tender.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('services', 'name slug shortDescription emoji');
    
    res.status(200).json({
      success: true,
      message: 'Tender updated successfully',
      data: updatedTender
    });
  } catch (error) {
    console.error('Error updating tender:', error);
    
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tender'
    });
  }
};

// Delete tender
exports.deleteTender = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }
    
    if (tender.pdf && tender.pdf.path) {
      fs.unlink(tender.pdf.path, (err) => {
        if (err) console.error('Error deleting PDF:', err);
      });
    }
    
    await tender.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Tender deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tender:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tender'
    });
  }
};

// Update tender status
exports.updateTenderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'closed', 'awarded', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: open, closed, awarded, cancelled'
      });
    }
    
    const tender = await Tender.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!tender) {
      return res.status(404).json({
        success: false,
        message: 'Tender not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tender status updated successfully',
      data: tender
    });
  } catch (error) {
    console.error('Error updating tender status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tender status'
    });
  }
};

// Download tender PDF
exports.downloadPDF = async (req, res) => {
  try {
    const tender = await Tender.findById(req.params.id);
    
    if (!tender || !tender.pdf || !tender.pdf.path) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }
    
    const filePath = tender.pdf.path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on server'
      });
    }
    
    res.download(filePath, tender.pdf.originalName);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF'
    });
  }
};

// Get tender statistics
exports.getTenderStats = async (req, res) => {
  try {
    const totalTenders = await Tender.countDocuments();
    const openTenders = await Tender.countDocuments({ status: 'open' });
    const closedTenders = await Tender.countDocuments({ status: 'closed' });
    const awardedTenders = await Tender.countDocuments({ status: 'awarded' });
    const cancelledTenders = await Tender.countDocuments({ status: 'cancelled' });
    
    const categoryStats = await Tender.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalTenders,
        open: openTenders,
        closed: closedTenders,
        awarded: awardedTenders,
        cancelled: cancelledTenders,
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching tender stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};
