const mongoose = require('mongoose');
const GalleryItem = require('../models/GalleryItem');
require('../models/Category');
const Service = require('../models/Service');
const { publicUploadPath } = require('../utils/uploadStorage');

const buildPayload = (body = {}, file) => ({
  title: body.title?.trim(),
  category: body.category?.trim() || 'Workshop',
  image: file ? publicUploadPath('gallery', file.filename) : body.image?.trim(),
  description: body.description?.trim() || '',
  featured: body.featured === 'true' || body.featured === true,
  isActive: body.isActive === undefined ? true : body.isActive === 'true' || body.isActive === true,
  order: Number(body.order) || 0
});

exports.getGalleryItems = async (req, res) => {
  try {
    const query = {};

    if (req.query.includeInactive !== 'true') {
      query.isActive = true;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // Fetch database GalleryItems if no service filter is requested.
    // Generic gallery items do not belong to specific services.
    let items = [];
    if (!req.query.service) {
      const galleryQuery = GalleryItem.find(query).sort({ order: 1, createdAt: -1 });
      items = await galleryQuery;
    }

    const includeServiceMedia = req.query.includeServiceMedia !== 'false';
    let serviceMediaItems = [];

    if (includeServiceMedia && req.query.featured !== 'true') {
      const serviceQuery = { isActive: true };
      
      // If service filter is active, check if it's an ObjectId or a slug
      if (req.query.service) {
        if (mongoose.Types.ObjectId.isValid(req.query.service)) {
          serviceQuery._id = req.query.service;
        } else {
          serviceQuery.slug = req.query.service.toLowerCase();
        }
      }

      const services = await Service.find(serviceQuery)
        .select('name slug heroImage images beforeImages afterImages categoryId updatedAt')
        .populate('categoryId', 'name')
        .sort({ order: 1, name: 1 })
        .lean();

      serviceMediaItems = services.flatMap((service) => {
        const category = service.categoryId?.name || 'Service Media';
        const serviceImages = [
          ...(service.images || []).map((image, index) => ({
            field: 'images',
            image,
            label: 'Project Image',
            index
          })),
          ...(service.beforeImages || []).map((image, index) => ({
            field: 'beforeImages',
            image,
            label: 'Before Image',
            index
          })),
          ...(service.afterImages || []).map((image, index) => ({
            field: 'afterImages',
            image,
            label: 'After Image',
            index
          }))
        ].filter(media => media.image !== service.heroImage);

        return serviceImages.map((media) => ({
          _id: `service-${service._id}-${media.field}-${media.index}`,
          title: service.name,
          category,
          image: media.image,
          description: `${media.label} for ${service.name}`,
          featured: false,
          isActive: true,
          order: 1000,
          source: 'service',
          serviceSlug: service.slug,
          serviceId: service._id,
          createdAt: service.updatedAt,
          updatedAt: service.updatedAt
        }));
      });

      // Filter serviceMediaItems by category if specified
      if (req.query.category) {
        serviceMediaItems = serviceMediaItems.filter(
          item => item.category.toLowerCase() === req.query.category.toLowerCase()
        );
      }
    }

    // Combine both sources
    const combinedItems = [...items.map(item => item.toObject()), ...serviceMediaItems];

    // Interleave items by group to mix different services and general items together
    const groups = {};
    combinedItems.forEach(item => {
      const key = item.title || 'General';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    const interleavedItems = [];
    const keys = Object.keys(groups);
    let maxLen = 0;
    keys.forEach(k => {
      if (groups[k].length > maxLen) {
        maxLen = groups[k].length;
      }
    });

    for (let i = 0; i < maxLen; i++) {
      keys.forEach(k => {
        if (i < groups[k].length) {
          interleavedItems.push(groups[k][i]);
        }
      });
    }

    // Pagination: default page 1, 50 items per page
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 50, 1);
    
    const totalItems = interleavedItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = interleavedItems.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      },
      message: 'Gallery items fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gallery items',
      error: error.message
    });
  }
};

exports.createGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.create(buildPayload(req.body, req.file));

    res.status(201).json({
      success: true,
      data: item,
      message: 'Gallery item created successfully'
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gallery item',
      error: error.message
    });
  }
};

exports.updateGalleryItem = async (req, res) => {
  try {
    const payload = buildPayload(req.body, req.file);

    if (!payload.image) {
      delete payload.image;
    }

    const item = await GalleryItem.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Gallery item updated successfully'
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gallery item',
      error: error.message
    });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Gallery item moved to inactive successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gallery item',
      error: error.message
    });
  }
};
