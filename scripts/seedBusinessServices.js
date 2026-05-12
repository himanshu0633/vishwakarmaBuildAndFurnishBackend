const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');
const { buildServiceAutoFields } = require('../utils/catalogAuto');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const serviceGroups = [
  {
    categorySlug: 'furniture-services',
    services: [
      'Wooden Doors',
      'Wooden Windows',
      'Ply Board Door',
      'Wooden Jali single-double Doors',
      'Double Bed',
      'Modular Kitchen',
      'Sofa Set',
      'Luxury Sofa',
      'Bed',
      'Hydraulic Bed',
      'Wardrobe',
      'Sliding Wardrobe',
      'TV Unit',
      'Dining Table',
      'Center Table',
      'Office Furniture',
      'Reception Counter',
      'Study Table',
      'Pooja Mandir',
      'Shoe Rack',
      'Cafe Furniture',
      'Restaurant Furniture',
      'Customized Furniture'
    ]
  },
  {
    categorySlug: 'construction-services',
    services: [
      'House Construction',
      'Turnkey Projects',
      'RCC Work',
      'Brick Work',
      'Cement Work',
      'Foundation Work',
      'Roof Casting',
      'Boundary Wall',
      'Tiles Work',
      'Marble Work',
      'Paint Work',
      'Plumbing',
      'Electrical Work',
      'Staircase Construction',
      'Commercial Construction',
      'Shop Construction',
      'Site Supervision',
      'Civil Contractor'
    ]
  },
  {
    categorySlug: 'interior-services',
    services: [
      'False Ceiling',
      'POP Design',
      'Wall Panels',
      'Wallpaper Installation',
      'Modular Interior',
      'Living Room Interior',
      'Bedroom Interior',
      'Kitchen Interior',
      'Office Interior',
      'Lighting Design',
      'TV Panel Design',
      'Glass Work',
      'Wooden Flooring',
      'Curtains & Blinds',
      'Luxury Interior Design',
      'Space Planning',
      '3D Interior Design'
    ]
  }
];

const emojiForService = (name) => {
  const lower = name.toLowerCase();

  if (lower.includes('kitchen')) return '🍽️';
  if (lower.includes('window')) return '🪟';
  if (lower.includes('door')) return '🚪';
  if (lower.includes('ply') || lower.includes('jali')) return '🪵';
  if (lower.includes('sofa')) return '🛋️';
  if (lower.includes('bed')) return '🛏️';
  if (lower.includes('wardrobe')) return '🚪';
  if (lower.includes('table')) return '🪑';
  if (lower.includes('construction') || lower.includes('contractor')) return '🏗️';
  if (lower.includes('electrical')) return '💡';
  if (lower.includes('plumbing')) return '🚿';
  if (lower.includes('paint')) return '🎨';
  if (lower.includes('tiles') || lower.includes('marble')) return '⬜';
  if (lower.includes('ceiling') || lower.includes('pop')) return '✨';
  if (lower.includes('interior') || lower.includes('design')) return '🏡';
  if (lower.includes('glass')) return '🪟';
  if (lower.includes('flooring')) return '🪵';

  return '🔧';
};

const buildShortDescription = (name, categoryName) =>
  `Premium ${name.toLowerCase()} service for ${categoryName.toLowerCase()} in Charkhi Dadri.`;

const buildFullDescription = (name, categoryName) =>
  `Get professional ${name.toLowerCase()} service by Vishwakarma Build & Furnish CKD. We provide expert planning, quality materials, skilled workmanship, and modern finishing for ${categoryName.toLowerCase()} projects in Charkhi Dadri and nearby Haryana areas.`;

const priorityServices = [
  'Wooden Doors',
  'Wooden Windows',
  'Ply Board Door',
  'Wooden Jali single-double Doors',
  'Double Bed',
  'Modular Kitchen',
  'House Construction',
  'False Ceiling',
  'Luxury Interior Design'
];

const seedBusinessServices = async () => {
  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let updated = 0;

  for (const group of serviceGroups) {
    const category = await Category.findOne({ slug: group.categorySlug });

    if (!category) {
      console.warn(`Category not found: ${group.categorySlug}`);
      continue;
    }

    for (const [index, serviceName] of group.services.entries()) {
      const autoFields = buildServiceAutoFields(serviceName, category.name);
      const payload = {
        categoryId: category._id,
        name: serviceName,
        slug: autoFields.slug,
        shortDescription: buildShortDescription(serviceName, category.name),
        fullDescription: buildFullDescription(serviceName, category.name),
        emoji: emojiForService(serviceName),
        popular: priorityServices.includes(serviceName),
        featured: priorityServices.includes(serviceName),
        priceStarting: 'Custom quote',
        seoTitle: autoFields.seoTitle,
        seoDescription: autoFields.seoDescription,
        tags: autoFields.tags,
        faq: [],
        order: index + 1,
        isActive: true
      };

      const result = await Service.updateOne(
        { slug: payload.slug },
        { $set: payload },
        { upsert: true }
      );

      if (result.upsertedCount) {
        created += 1;
      } else {
        updated += 1;
      }
    }
  }

  console.log(`Business services seeded. Created: ${created}, Updated: ${updated}`);
  await mongoose.disconnect();
};

seedBusinessServices().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
