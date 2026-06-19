const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
require('../models/Category');
const Service = require('../models/Service');
const slugify = require('../utils/slugify');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const unique = (items = []) => {
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

const lower = (value = '') => String(value || '').toLowerCase().trim();

const getServiceImages = (service) =>
  unique([
    service.heroImage,
    ...(service.images || []),
    ...(service.beforeImages || []),
    ...(service.afterImages || [])
  ]).slice(0, 9);

const getBlogTitle = (service) => {
  const rawName = service.name || 'Service';
  const name = rawName
    .replace(/\bcustomized\b/gi, 'Custom')
    .replace(/\bcustom\b/gi, 'Custom')
    .replace(/\bdesigns?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedName = lower(name);

  if (normalizedName.includes('bed')) {
    return `Custom ${name} Manufacturing in Charkhi Dadri`;
  }

  if (normalizedName.includes('kitchen') || normalizedName.includes('wardrobe') || normalizedName.includes('tv')) {
    return `Latest ${name} Designs in Charkhi Dadri`;
  }

  if (normalizedName.includes('construction') || normalizedName.includes('paint') || normalizedName.includes('electrical') || normalizedName.includes('plumbing')) {
    return `Professional ${name} Services in Charkhi Dadri`;
  }

  return normalizedName.startsWith('custom ')
    ? `${name} Designs in Charkhi Dadri`
    : `Custom ${name} Designs in Charkhi Dadri`;
};

const getExcerpt = (service, categoryName) =>
  `Explore ${service.name} images, design ideas, material options, finishing quality, and custom ${lower(categoryName || 'service')} work in Charkhi Dadri, Haryana.`;

const getContent = (service, categoryName) => {
  const serviceName = service.name || 'this service';
  const category = categoryName || 'home improvement';

  return [
    `${serviceName} in Charkhi Dadri`,
    `Vishwakarma Build & Furnish provides customized ${lower(serviceName)} work for homes, shops, offices, and renovation projects in Charkhi Dadri and nearby Haryana areas.`,
    `Every project is planned according to the client's space, required quality, design preference, material selection, and budget. Our focus is clean finishing, practical use, reliable workmanship, and long-term durability.`,
    `Before finalizing any ${lower(serviceName)} design, it is important to compare size, material grade, finish, hardware, maintenance needs, and the way the space will be used every day.`,
    `Pricing depends on measurements, material quality, design complexity, finishing, and total project quantity. For accurate guidance, share your requirement with Vishwakarma Build & Furnish and get a custom quote for ${lower(category)} work.`
  ].join('\n\n');
};

const getTags = (service, categoryName) =>
  unique([
    service.name,
    `${service.name} images`,
    `${service.name} design`,
    `latest ${lower(service.name)} design`,
    `best ${lower(service.name)} in Charkhi Dadri`,
    `${service.name} price in Charkhi Dadri`,
    categoryName,
    `${categoryName} services`,
    'custom furniture Charkhi Dadri',
    'interior design Haryana',
    'construction services Haryana',
    'Vishwakarma Build and Furnish',
    'Charkhi Dadri',
    'Haryana',
    ...(service.tags || [])
  ]).slice(0, 24);

const getFaq = (service, categoryName) => {
  const serviceName = service.name || 'this service';
  const category = categoryName || 'this category';
  const serviceKeyword = lower(serviceName);
  const categoryKeyword = lower(category);

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
      answer: `Timeline depends on design detail, site readiness, measurements, material availability, and project size. After inspection or requirement discussion, we provide a realistic completion timeline.`
    },
    {
      question: `Do you provide customized ${category} work in Charkhi Dadri and nearby areas?`,
      answer: `Yes, we provide customized ${categoryKeyword} work in Charkhi Dadri and nearby Haryana locations for homes, offices, shops, renovation projects, and new construction requirements.`
    }
  ];
};

const getUniqueSlug = (title, service, usedSlugs) => {
  const baseSlug = slugify(title);

  if (!usedSlugs.has(baseSlug)) {
    usedSlugs.add(baseSlug);
    return baseSlug;
  }

  const fallbackSlug = slugify(`${title} ${service.slug || service._id}`);
  usedSlugs.add(fallbackSlug);
  return fallbackSlug;
};

const seedBlogs = async () => {
  await mongoose.connect(MONGODB_URI);

  const services = await Service.find({ isActive: true })
    .populate('categoryId', 'name slug')
    .sort({ order: 1, name: 1 })
    .lean();

  const deleted = await Blog.deleteMany({});
  const usedSlugs = new Set();

  const blogs = services.map((service, index) => {
    const categoryName = service.categoryId?.name || 'Furniture';
    const title = getBlogTitle(service);
    const blogImages = getServiceImages(service);
    const slug = getUniqueSlug(title, service, usedSlugs);
    const excerpt = getExcerpt(service, categoryName);

    return {
      title,
      slug,
      excerpt,
      content: getContent(service, categoryName),
      coverImage: blogImages[0] || service.heroImage || '',
      blogImage: blogImages[0] || '',
      blogImages,
      categoryId: service.categoryId?._id || null,
      category: categoryName,
      relatedServices: [service._id],
      seoTitle: `${title} | Vishwakarma Build & Furnish`,
      seoDescription: excerpt.slice(0, 155),
      tags: getTags(service, categoryName),
      faq: getFaq(service, categoryName),
      featured: index < 12,
      isActive: true,
      order: index + 1,
      publishedAt: new Date()
    };
  });

  if (blogs.length) {
    await Blog.insertMany(blogs);
  }

  console.log(`Deleted old blogs: ${deleted.deletedCount}`);
  console.log(`Created new service blogs: ${blogs.length}`);
  console.log(`Blogs without selected images: ${blogs.filter((blog) => !blog.blogImages.length).length}`);

  await mongoose.disconnect();
};

seedBlogs().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
