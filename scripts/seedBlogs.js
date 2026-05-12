const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const priorityServiceSlugs = [
  'wooden-doors-charkhi-dadri',
  'wooden-windows-charkhi-dadri',
  'ply-board-door-charkhi-dadri',
  'wooden-jali-single-double-doors-charkhi-dadri',
  'double-bed-charkhi-dadri',
  'modular-kitchen-charkhi-dadri'
];

const blogSeeds = [
  {
    serviceSlug: 'wooden-doors-charkhi-dadri',
    title: 'Premium Wooden Doors in Charkhi Dadri',
    excerpt: 'Strong, stylish, and custom wooden doors for modern homes and commercial spaces.',
    tags: ['wooden doors', 'doors', 'furniture', 'charkhi dadri'],
    order: 1
  },
  {
    serviceSlug: 'wooden-windows-charkhi-dadri',
    title: 'Custom Wooden Windows for Luxury Homes',
    excerpt: 'Elegant wooden window designs with premium finishing and durable material selection.',
    tags: ['wooden windows', 'windows', 'woodwork', 'charkhi dadri'],
    order: 2
  },
  {
    serviceSlug: 'ply-board-door-charkhi-dadri',
    title: 'Ply Board Door Designs for Modern Interiors',
    excerpt: 'Affordable and durable ply board doors with clean finishing for every room.',
    tags: ['ply board door', 'door design', 'furniture', 'interior'],
    order: 3
  },
  {
    serviceSlug: 'wooden-jali-single-double-doors-charkhi-dadri',
    title: 'Wooden Jali Single and Double Door Designs',
    excerpt: 'Decorative wooden jali door work for entrances, pooja rooms, and interior partitions.',
    tags: ['wooden jali door', 'single door', 'double door', 'woodwork'],
    order: 4
  },
  {
    serviceSlug: 'double-bed-charkhi-dadri',
    title: 'Custom Double Bed Manufacturing in Charkhi Dadri',
    excerpt: 'Premium double beds made with strong structure, modern design, and custom storage options.',
    tags: ['double bed', 'bed', 'furniture', 'hydraulic bed'],
    order: 5
  },
  {
    serviceSlug: 'modular-kitchen-charkhi-dadri',
    title: 'Modular Kitchen Solutions in Charkhi Dadri',
    excerpt: 'Modern modular kitchen planning, cabinets, storage, and premium finishing for daily comfort.',
    tags: ['modular kitchen', 'kitchen', 'furniture', 'interior'],
    order: 6
  }
];

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildContent = (title, serviceName) => `
${title}

Vishwakarma Build & Furnish CKD provides professional ${serviceName.toLowerCase()} service in Charkhi Dadri and nearby Haryana areas. Every project is planned according to the client's space, budget, material preference, and design taste.

Our team focuses on premium material selection, strong workmanship, clean finishing, and practical designs that look beautiful and remain useful for daily life. Whether you need work for a new home, renovation, shop, office, or rental property, we customize every detail according to your requirement.

Pricing depends on your required quality, design, size, material, and total project quantity. For the best deal and proper guidance, contact Vishwakarma Build & Furnish CKD for a free consultation.
`.trim();

const seedBlogs = async () => {
  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let updated = 0;
  const priorityServices = await Service.find({ slug: { $in: priorityServiceSlugs } }).select('_id slug');
  const priorityServiceIds = priorityServiceSlugs
    .map((serviceSlug) => priorityServices.find((service) => service.slug === serviceSlug)?._id)
    .filter(Boolean);

  for (const blogSeed of blogSeeds) {
    const service = await Service.findOne({ slug: blogSeed.serviceSlug });

    const payload = {
      title: blogSeed.title,
      slug: slugify(blogSeed.title),
      excerpt: blogSeed.excerpt,
      content: buildContent(blogSeed.title, service?.name || blogSeed.title),
      coverImage: service?.heroImage || service?.images?.[0] || '',
      category: 'Furniture',
      relatedServices: priorityServiceIds.length ? priorityServiceIds : service ? [service._id] : [],
      seoTitle: `${blogSeed.title} | Vishwakarma Build & Furnish CKD`,
      seoDescription: blogSeed.excerpt,
      tags: [...blogSeed.tags, 'vishwakarma build furnish', 'haryana'],
      featured: true,
      isActive: true,
      order: blogSeed.order,
      publishedAt: new Date()
    };

    const result = await Blog.updateOne(
      { $or: [{ title: blogSeed.title }, { slug: payload.slug }] },
      { $set: payload },
      { upsert: true }
    );

    if (result.upsertedCount) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`Blogs seeded. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
};

seedBlogs().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
