const Category = require('../models/Category');
const Service = require('../models/Service');
const { buildCategoryAutoFields } = require('../utils/catalogAuto');

const normalizeCategoryPayload = (body) => {
  const name = body.name || '';
  const autoFields = buildCategoryAutoFields(name);

  return {
    name,
    slug: autoFields.slug,
    description: body.description || '',
    emoji: body.emoji || body.icon || '📦',
    icon: body.icon || body.emoji || '📦',
    image: body.image || '',
    seoTitle: autoFields.seoTitle,
    seoDescription: autoFields.seoDescription,
    isActive: true,
    order: Number(body.order) || 0
  };
};

const formatService = (service) => ({
  _id: service._id,
  categoryId: service.categoryId,
  name: service.name,
  slug: service.slug,
  shortDescription: service.shortDescription,
  fullDescription: service.fullDescription,
  emoji: service.emoji,
  heroImage: service.heroImage,
  images: service.images || [],
  beforeImages: service.beforeImages || [],
  afterImages: service.afterImages || [],
  videos: service.videos || [],
  popular: service.popular,
  featured: service.featured,
  priceStarting: service.priceStarting,
  seoTitle: service.seoTitle,
  seoDescription: service.seoDescription,
  tags: service.tags || [],
  features: service.features || [],
  relatedServices: service.relatedServices || [],
  faq: service.faq || [],
  order: service.order || 0,
  isActive: service.isActive,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt
});

const formatCategory = (category, services = []) => ({
  _id: category._id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  emoji: category.emoji,
  icon: category.icon || category.emoji,
  image: category.image,
  seoTitle: category.seoTitle,
  seoDescription: category.seoDescription,
  isActive: category.isActive,
  order: category.order,
  services: services.map(formatService),
  servicesCount: services.length,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt
});

exports.getAllCategoriesWithServices = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categoryQuery = includeInactive ? {} : { isActive: true };
    const serviceQuery = includeInactive ? {} : { isActive: true };

    const categories = await Category.find(categoryQuery)
      .sort({ order: 1, name: 1 })
      .lean();

    const categoriesWithServices = await Promise.all(
      categories.map(async (category) => {
        const services = await Service.find({
          ...serviceQuery,
          categoryId: category._id
        })
          .sort({ order: 1, featured: -1, popular: -1, name: 1 })
          .lean();

        return formatCategory(category, services);
      })
    );

    res.json({
      success: true,
      data: categoriesWithServices,
      message: 'Categories fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const services = await Service.find({
      categoryId: category._id,
      isActive: true
    })
      .sort({ order: 1, featured: -1, popular: -1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: formatCategory(category, services)
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true
    }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const services = await Service.find({
      categoryId: category._id,
      isActive: true
    })
      .sort({ order: 1, featured: -1, popular: -1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: formatCategory(category, services)
    });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const payload = normalizeCategoryPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existingCategory = await Category.findOne({
      $or: [{ name: payload.name }, { slug: payload.slug }]
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await Category.create(payload);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const payload = normalizeCategoryPayload(req.body);

    const category = await Category.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await Service.updateMany(
      { categoryId: req.params.id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};
