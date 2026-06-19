const Blog = require('../models/Blog');
const Service = require('../models/Service');
const Category = require('../models/Category');

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

const normalizeFaq = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim()
      }))
      .filter((item) => item.question || item.answer);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => {
        const [question, ...answerParts] = line.split('|');
        return {
          question: String(question || '').trim(),
          answer: answerParts.join('|').trim()
        };
      })
      .filter((item) => item.question || item.answer);
  }

  return [];
};

const normalizeBlogImages = (value, fallback = '') => {
  const images = normalizeList(value).slice(0, 9);
  if (!images.length && fallback) return [fallback].slice(0, 9);
  return images;
};

const uniqueList = (items = []) => {
  const seen = new Set();
  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const buildAutoTags = ({ title, categoryName, services = [] }) => {
  const serviceNames = services.map((service) => service?.name).filter(Boolean);
  const categoryNames = [
    categoryName,
    ...services.map((service) => service?.categoryId?.name).filter(Boolean)
  ];
  const base = [
    title,
    ...serviceNames,
    ...categoryNames,
    ...serviceNames.map((name) => `${name} design`),
    ...serviceNames.map((name) => `${name} price in Charkhi Dadri`),
    ...serviceNames.map((name) => `${name} images`),
    `${categoryName || 'furniture'} services`,
    'custom furniture Charkhi Dadri',
    'interior design Haryana',
    'construction services Haryana',
    'Vishwakarma Build and Furnish',
    'Charkhi Dadri',
    'Haryana'
  ];

  return uniqueList(base).slice(0, 24);
};

const buildAutoFaq = ({ title, categoryName, services = [] }) => {
  const serviceName = services[0]?.name || title || 'this service';
  const categoryText = categoryName || services[0]?.categoryId?.name || 'this category';
  const serviceKeyword = serviceName.toLowerCase();
  const categoryKeyword = categoryText.toLowerCase();

  return [
    {
      question: `Where can I get the best ${serviceName} service in Charkhi Dadri?`,
      answer: `Vishwakarma Build & Furnish provides custom ${serviceKeyword} service in Charkhi Dadri and nearby Haryana areas with design planning, material guidance, quality workmanship, and site-based execution.`
    },
    {
      question: `What is the price of ${serviceName} in Charkhi Dadri?`,
      answer: `The price of ${serviceKeyword} depends on measurements, material quality, finish, hardware, design complexity, and total project quantity. A custom quote is provided after understanding your exact requirement.`
    },
    {
      question: `Can I see ${serviceName} images and latest design options before finalizing?`,
      answer: `Yes, you can review ${serviceKeyword} images, design references, material samples, and finishing options before finalizing the work. You can also share your own reference image or video.`
    },
    {
      question: `Which materials are suitable for ${serviceName}?`,
      answer: `Material selection for ${serviceKeyword} depends on usage, budget, durability, moisture exposure, and desired finish. Our team suggests practical options for long-term performance and premium appearance.`
    },
    {
      question: `How long does ${serviceName} work usually take?`,
      answer: 'Timeline depends on design detail, site readiness, measurements, material availability, and project size. After inspection or requirement discussion, we provide a realistic completion timeline.'
    },
    {
      question: `Do you provide customized ${categoryText} work in Charkhi Dadri and nearby areas?`,
      answer: `Yes, we provide customized ${categoryKeyword} work in Charkhi Dadri and nearby Haryana locations for homes, offices, shops, renovation projects, and new construction requirements.`
    }
  ];
};

const normalizeBlogPayload = async (body = {}) => {
  const title = body.title?.trim();
  const excerpt = body.excerpt?.trim() || '';
  const content = body.content?.trim();
  const relatedServices = normalizeList(body.relatedServices);
  const serviceDocs = relatedServices.length
    ? await Service.find({ _id: { $in: relatedServices } }).populate('categoryId', 'name slug').lean()
    : [];
  const categoryDoc = body.categoryId
    ? await Category.findById(body.categoryId).select('name slug').lean()
    : null;
  const categoryName = categoryDoc?.name || body.category?.trim() || serviceDocs[0]?.categoryId?.name || 'Furniture';
  const manualTags = normalizeList(body.tags);
  const manualFaq = normalizeFaq(body.faq);
  const blogImages = normalizeBlogImages(body.blogImages, body.blogImage?.trim() || '');
  const slug = body.slug?.trim() ? slugify(body.slug) : title ? slugify(title) : undefined;
  const seoTitle =
    body.seoTitle?.trim() ||
    (title ? `${title} in Charkhi Dadri | Vishwakarma Build & Furnish` : undefined);
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
    blogImage: blogImages[0] || body.blogImage?.trim() || '',
    blogImages,
    categoryId: body.categoryId || categoryDoc?._id || serviceDocs[0]?.categoryId?._id || undefined,
    category: categoryName,
    relatedServices,
    seoTitle,
    seoDescription,
    tags: manualTags.length ? manualTags : buildAutoTags({ title, categoryName, services: serviceDocs }),
    faq: manualFaq.length ? manualFaq : buildAutoFaq({ title, categoryName, services: serviceDocs }),
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
      .populate('categoryId', 'name slug emoji image')
      .populate({
        path: 'relatedServices',
        select: 'name slug shortDescription heroImage images beforeImages afterImages videos categoryId isActive',
        populate: {
          path: 'categoryId',
          select: 'name slug emoji image'
        }
      })
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

    const blog = await Blog.findOne(query)
      .populate('categoryId', 'name slug emoji image')
      .populate({
        path: 'relatedServices',
        select: 'name slug shortDescription heroImage images beforeImages afterImages videos categoryId isActive',
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
    const blog = await Blog.findById(req.params.id)
      .populate('categoryId', 'name slug emoji image')
      .populate({
        path: 'relatedServices',
        select: 'name slug shortDescription heroImage images beforeImages afterImages videos categoryId isActive',
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

exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create(await normalizeBlogPayload(req.body));

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
      await normalizeBlogPayload(req.body),
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
