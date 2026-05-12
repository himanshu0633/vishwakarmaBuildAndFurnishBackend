const Blog = require('../models/Blog');

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeBlogPayload = (body = {}) => {
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim() || '';
  const content = body.content?.trim();
  const slug = body.slug?.trim() ? slugify(body.slug) : title ? slugify(title) : undefined;
  const seoTitle =
    body.seoTitle?.trim() ||
    (title ? `${title} | Vishwakarma Build & Furnish CKD` : undefined);
  const seoDescription =
    body.seoDescription?.trim() ||
    excerpt ||
    (content ? content.slice(0, 155) : undefined);

  const payload = {
    title,
    slug,
    excerpt,
    content,
    coverImage: body.coverImage?.trim() || '',
    category: body.category?.trim() || 'Furniture',
    relatedServices: normalizeList(body.relatedServices),
    seoTitle,
    seoDescription,
    tags: normalizeList(body.tags),
    featured: Boolean(body.featured),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    order: Number(body.order) || 0,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date()
  };

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
};

exports.getAllBlogs = async (req, res) => {
  try {
    const query = {};

    if (req.query.includeInactive !== 'true') {
      query.isActive = true;
    }

    if (req.query.featured === 'true') {
      query.featured = true;
    }

    if (req.query.serviceId) {
      query.relatedServices = req.query.serviceId;
    }

    const limit = Math.min(Number(req.query.limit) || 0, 50);
    const blogQuery = Blog.find(query)
      .populate('relatedServices', 'name slug shortDescription heroImage images categoryId isActive')
      .sort({ order: 1, publishedAt: -1, createdAt: -1 });

    if (limit) {
      blogQuery.limit(limit);
    }

    const blogs = await blogQuery;

    res.json({
      success: true,
      data: blogs,
      message: 'Blogs fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const query = { slug: req.params.slug };

    if (req.query.includeInactive !== 'true') {
      query.isActive = true;
    }

    const blog = await Blog.findOne(query).populate({
      path: 'relatedServices',
      select: 'name slug shortDescription heroImage images categoryId isActive',
      match: { isActive: true },
      populate: {
        path: 'categoryId',
        select: 'name slug emoji image'
      }
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog,
      message: 'Blog fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('relatedServices', 'name slug isActive');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog,
      message: 'Blog fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create(normalizeBlogPayload(req.body));

    res.status(201).json({
      success: true,
      data: blog,
      message: 'Blog created successfully'
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      normalizeBlogPayload(req.body),
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog,
      message: 'Blog updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating blog',
      error: error.message
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog,
      message: 'Blog moved to inactive successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message
    });
  }
};
