const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

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

Vishwakarma Build & Furnish CKD provides professional ${serviceName.toLowerCase()} service in Charkhi Dadri and nearby Haryana areas. If you are checking ${serviceName.toLowerCase()} images, latest ${serviceName.toLowerCase()} designs, material options, finishing quality, or the best ${serviceName.toLowerCase()} maker near you, this guide will help you compare the right choices.

Our team focuses on premium material selection, strong workmanship, clean finishing, and practical designs that look beautiful and remain useful for daily life. Whether you need work for a new home, renovation, shop, office, or rental property, we customize every detail according to your requirement.

For image search and design comparison, always check the wood or board quality, polish or laminate finish, edge finishing, hardware, measurements, and long-term maintenance. A design may look good online, but the final result becomes better when it is made according to your wall size, room use, sunlight, moisture, and daily handling.

Pricing depends on your required quality, design, size, material, and total project quantity. For the best deal and proper guidance, contact Vishwakarma Build & Furnish CKD for a free consultation.
`.trim();

const buildGenericBlogSeed = (service, index) => ({
  serviceSlug: service.slug,
  title: `Latest ${service.name} Designs in Charkhi Dadri`,
  excerpt: `Check ${service.name.toLowerCase()} images, latest designs, material options, finishing quality, and custom work in Charkhi Dadri, Haryana.`,
  tags: [
    service.name.toLowerCase(),
    `${service.name.toLowerCase()} images`,
    `latest ${service.name.toLowerCase()} design`,
    `best ${service.name.toLowerCase()} in charkhi dadri`,
    'furniture',
    'haryana'
  ],
  order: 20 + index
});

const seedBlogs = async () => {
  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let updated = 0;

  const activeServices = await Service.find({ isActive: true }).select('_id slug name heroImage images');
  const allBlogSeeds = [
    ...blogSeeds,
    ...activeServices
      .filter((service) => !blogSeeds.some((seed) => seed.serviceSlug === service.slug))
      .map(buildGenericBlogSeed)
  ];

  for (const blogSeed of allBlogSeeds) {
    const service = await Service.findOne({ slug: blogSeed.serviceSlug });

    const payload = {
      title: blogSeed.title,
      slug: slugify(blogSeed.title),
      excerpt: blogSeed.excerpt,
      content: buildContent(blogSeed.title, service?.name || blogSeed.title),
      coverImage: service?.heroImage || service?.images?.[0] || '',
      category: 'Furniture',
      relatedServices: service?._id ? [service._id] : [],
      seoTitle: `${blogSeed.title} | Best ${service?.name || 'Furniture'} in Charkhi Dadri`,
      seoDescription: blogSeed.excerpt,
      tags: [...blogSeed.tags, 'vishwakarma build furnish', 'charkhi dadri', 'haryana'],
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
