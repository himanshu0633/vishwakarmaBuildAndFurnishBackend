const Service = require('../models/Service');
const Category = require('../models/Category');
const { buildServiceAutoFields } = require('../utils/catalogAuto');

const featuredServicePriority = [
  'wooden doors',
  'wooden windows',
  'ply board door',
  'wooden jali doors',
  'pvc panels'
];

const normalizePriorityName = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/single[-\s]*double/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const featuredPriorityIndex = (service) => {
  const name = normalizePriorityName(service?.name);
  const slug = normalizePriorityName(service?.slug);

  const index = featuredServicePriority.findIndex(priority =>
    name === priority || slug.startsWith(priority)
  );

  return index === -1 ? featuredServicePriority.length : index;
};

const sortFeaturedServices = (services = []) =>
  services.sort((first, second) => {
    const firstPriority = featuredPriorityIndex(first);
    const secondPriority = featuredPriorityIndex(second);

    if (firstPriority !== secondPriority) {
      return firstPriority - secondPriority;
    }

    return 0;
  });

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return value
    .toString()
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const normalizeFaq = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  return value
    .toString()
    .split('\n')
    .map(line => {
      const [question, ...answerParts] = line.split('|');
      return {
        question: (question || '').trim(),
        answer: answerParts.join('|').trim()
      };
    })
    .filter(item => item.question || item.answer);
};

const normalizeServicePayload = (body, categoryName = '') => {
  const name = body.name || '';
  const autoFields = buildServiceAutoFields(name, categoryName);

  const payload = {
    categoryId: body.categoryId,
    name,
    slug: autoFields.slug,
    shortDescription: body.shortDescription || '',
    fullDescription: body.fullDescription || '',
    emoji: body.emoji || '🔧',
    heroImage: body.heroImage || '',
    popular: Boolean(body.popular),
    featured: Boolean(body.featured),
    priceStarting: body.priceStarting || '',
    seoTitle: autoFields.seoTitle,
    seoDescription: autoFields.seoDescription,
    tags: autoFields.tags,
    features: asArray(body.features),
    relatedServices: asArray(body.relatedServices),
    faq: normalizeFaq(body.faq),
    order: Number(body.order) || 0,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
  };

  if (Object.prototype.hasOwnProperty.call(body, 'images')) {
    payload.images = asArray(body.images);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'beforeImages')) {
    payload.beforeImages = asArray(body.beforeImages);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'afterImages')) {
    payload.afterImages = asArray(body.afterImages);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'videos')) {
    payload.videos = asArray(body.videos);
  }

  return payload;
};

const servicePopulate = 'name slug emoji icon image';

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('categoryId', servicePopulate)
      .populate('relatedServices', 'name slug shortDescription emoji heroImage images priceStarting featured popular');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

exports.getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({
      slug: req.params.slug,
      isActive: true
    })
      .populate('categoryId', servicePopulate)
      .populate({
        path: 'relatedServices',
        match: { isActive: true },
        select: 'name slug shortDescription emoji heroImage images priceStarting featured popular'
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service',
      error: error.message
    });
  }
};

exports.getServiceMediaBySlug = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);

    const service = await Service.findOne({
      slug: req.params.slug,
      isActive: true
    }).select('name slug images beforeImages afterImages videos');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const mediaItems = [
      ...(service.images || []).map(url => ({ field: 'images', title: 'Project Images', type: 'image', url })),
      ...(service.beforeImages || []).map(url => ({ field: 'beforeImages', title: 'Before Images', type: 'image', url })),
      ...(service.afterImages || []).map(url => ({ field: 'afterImages', title: 'After Images', type: 'image', url })),
      ...(service.videos || []).map(url => ({ field: 'videos', title: 'Videos / Reels', type: 'video', url }))
    ];

    const total = mediaItems.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = mediaItems.slice(start, start + limit);

    res.json({
      success: true,
      data: {
        items,
        page: safePage,
        limit,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching service media:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service media',
      error: error.message
    });
  }
};

exports.getPopularServices = async (req, res) => {
  try {
    const services = await Service.find({
      popular: true,
      isActive: true
    })
      .populate('categoryId', servicePopulate)
      .limit(6)
      .sort({ featured: -1, createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular services',
      error: error.message
    });
  }
};

exports.searchServices = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const services = await Service.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { fullDescription: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .populate('categoryId', servicePopulate)
      .limit(20);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching services',
      error: error.message
    });
  }
};

exports.createService = async (req, res) => {
  try {
    const category = await Category.findById(req.body.categoryId);
    const payload = normalizeServicePayload(req.body, category?.name || '');

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const existingService = await Service.findOne({ slug: payload.slug });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service slug already exists'
      });
    }

    const service = await Service.create(payload);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating service',
      error: error.message
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const category = req.body.categoryId
      ? await Category.findById(req.body.categoryId)
      : null;
    const payload = normalizeServicePayload(req.body, category?.name || '');

    if (payload.categoryId) {
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).populate('categoryId', servicePopulate);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating service',
      error: error.message
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: error.message
    });
  }
};

exports.uploadServiceMedia = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const filesByField = req.files || {};
    const files = Array.isArray(filesByField)
      ? { media: filesByField }
      : filesByField;

    const collectUrls = (fieldName, matcher = () => true) => (files[fieldName] || [])
      .filter(matcher)
      .map(file => `/uploads/services/${file.filename}`);

    const legacyFiles = files.media || [];
    const legacyImageUrls = [];
    const legacyVideoUrls = [];

    legacyFiles.forEach((file) => {
      const fileUrl = `/uploads/services/${file.filename}`;

      if (file.mimetype.startsWith('video/')) {
        legacyVideoUrls.push(fileUrl);
      } else {
        legacyImageUrls.push(fileUrl);
      }
    });

    service.images = [
      ...(service.images || []),
      ...legacyImageUrls,
      ...collectUrls('images', file => file.mimetype.startsWith('image/'))
    ];
    service.beforeImages = [
      ...(service.beforeImages || []),
      ...collectUrls('beforeImages', file => file.mimetype.startsWith('image/'))
    ];
    service.afterImages = [
      ...(service.afterImages || []),
      ...collectUrls('afterImages', file => file.mimetype.startsWith('image/'))
    ];
    service.videos = [
      ...(service.videos || []),
      ...legacyVideoUrls,
      ...collectUrls('videos', file => file.mimetype.startsWith('video/'))
    ];

    if (!service.heroImage && service.images.length > 0) {
      service.heroImage = service.images[0];
    }

    await service.save();

    res.json({
      success: true,
      data: service,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading service media:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading service media',
      error: error.message
    });
  }
};

exports.deleteServiceMedia = async (req, res) => {
  try {
    const { field, url } = req.body;
    const allowedFields = ['images', 'beforeImages', 'afterImages', 'videos'];

    if (!allowedFields.includes(field) || !url) {
      return res.status(400).json({
        success: false,
        message: 'Valid media field and url are required'
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service[field] = (service[field] || []).filter(item => item !== url);
    await service.save();

    res.json({
      success: true,
      data: service,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service media:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service media',
      error: error.message
    });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const query = includeInactive ? {} : { isActive: true };

    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    if (req.query.popular === 'true') {
      query.popular = true;
    }

    const services = await Service.find(query)
      .populate('categoryId', servicePopulate)
      .populate('relatedServices', 'name slug shortDescription emoji heroImage images priceStarting featured popular')
      .sort({ order: 1, featured: -1, popular: -1, name: 1 });
    const orderedServices = req.query.featured === 'true'
      ? sortFeaturedServices([...services])
      : services;

    res.json({
      success: true,
      data: orderedServices
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching services',
      error: error.message
    });
  }
};
