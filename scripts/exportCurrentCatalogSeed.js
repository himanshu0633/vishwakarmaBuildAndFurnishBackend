const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';
const OUTPUT_FILE = path.join(__dirname, 'seedCurrentCatalog.js');

const pickFields = (source, fields) =>
  fields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      payload[field] = source[field];
    }

    return payload;
  }, {});

const categoryFields = [
  'name',
  'category',
  'slug',
  'description',
  'emoji',
  'icon',
  'image',
  'seoTitle',
  'seoDescription',
  'isActive',
  'order'
];

const serviceFields = [
  'name',
  'slug',
  'shortDescription',
  'fullDescription',
  'emoji',
  'heroImage',
  'images',
  'beforeImages',
  'afterImages',
  'videos',
  'popular',
  'featured',
  'priceStarting',
  'seoTitle',
  'seoDescription',
  'tags',
  'features',
  'faq',
  'order',
  'views',
  'clicks',
  'isActive'
];

const buildSeedFile = (categories, services) => `const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const categories = ${JSON.stringify(categories, null, 2)};

const services = ${JSON.stringify(services, null, 2)};

const seedCurrentCatalog = async () => {
  await mongoose.connect(MONGODB_URI);

  const categoryMap = new Map();

  for (const category of categories) {
    const payload = {
      ...category,
      category: category.category || category.name,
      icon: category.icon || category.emoji || ''
    };

    await Category.updateOne(
      { slug: payload.slug },
      { $set: payload },
      { upsert: true, runValidators: true }
    );

    const savedCategory = await Category.findOne({ slug: payload.slug }).select('_id slug');
    categoryMap.set(payload.slug, savedCategory._id);
  }

  const serviceMap = new Map();

  for (const service of services) {
    const categoryId = categoryMap.get(service.categorySlug);

    if (!categoryId) {
      console.warn(\`Category not found for service: \${service.name} (\${service.categorySlug})\`);
      continue;
    }

    const { categorySlug, relatedServiceSlugs, ...servicePayload } = service;

    await Service.updateOne(
      { slug: servicePayload.slug },
      {
        $set: {
          ...servicePayload,
          categoryId,
          relatedServices: []
        }
      },
      { upsert: true, runValidators: true }
    );

    const savedService = await Service.findOne({ slug: servicePayload.slug }).select('_id slug');
    serviceMap.set(servicePayload.slug, savedService._id);
  }

  for (const service of services) {
    const relatedServices = (service.relatedServiceSlugs || [])
      .map(slug => serviceMap.get(slug))
      .filter(Boolean);

    await Service.updateOne(
      { slug: service.slug },
      { $set: { relatedServices } },
      { runValidators: true }
    );
  }

  console.log(\`Current catalog seed complete. Categories: \${categories.length}, Services: \${services.length}\`);
  await mongoose.disconnect();
};

seedCurrentCatalog().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
`;

const exportCurrentCatalogSeed = async () => {
  await mongoose.connect(MONGODB_URI);

  const categoryDocs = await Category.find({})
    .sort({ order: 1, name: 1 })
    .lean();

  const serviceDocs = await Service.find({})
    .populate('categoryId', 'slug')
    .populate('relatedServices', 'slug')
    .sort({ order: 1, name: 1 })
    .lean();

  const categories = categoryDocs.map(category => pickFields(category, categoryFields));
  const services = serviceDocs.map(service => ({
    categorySlug: service.categoryId?.slug || '',
    relatedServiceSlugs: (service.relatedServices || []).map(relatedService => relatedService.slug).filter(Boolean),
    ...pickFields(service, serviceFields)
  }));

  fs.writeFileSync(OUTPUT_FILE, buildSeedFile(categories, services));

  console.log(`Seed file generated: ${OUTPUT_FILE}`);
  console.log(`Categories: ${categories.length}, Services: ${services.length}`);
  await mongoose.disconnect();
};

exportCurrentCatalogSeed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
