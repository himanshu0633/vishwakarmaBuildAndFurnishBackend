const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const seedCatalog = async () => {
  await mongoose.connect(MONGODB_URI);

  await Service.deleteMany({});
  await Category.deleteMany({});

  const furnitureCategory = await Category.create({
    name: 'Furniture Services',
    slug: 'furniture-services',
    emoji: '🛋️',
    icon: '🛋️',
    description: 'Custom furniture manufacturing services',
    image: '',
    seoTitle: 'Furniture Services in Charkhi Dadri',
    seoDescription: 'Luxury custom furniture services in Haryana',
    isActive: true,
    order: 1
  });

  const constructionCategory = await Category.create({
    name: 'Construction Services',
    slug: 'construction-services',
    emoji: '🏠',
    icon: '🏠',
    description: 'Complete house construction and trusted contractor services',
    image: '',
    seoTitle: 'House Construction Services in Charkhi Dadri',
    seoDescription: 'Premium house construction contractor services in Haryana',
    isActive: true,
    order: 2
  });

  const interiorCategory = await Category.create({
    name: 'Interior Services',
    slug: 'interior-services',
    emoji: '✨',
    icon: '✨',
    description: 'Modern interior design and furnishing solutions',
    image: '',
    seoTitle: 'Interior Services in Charkhi Dadri',
    seoDescription: 'Modern interior solutions for homes and commercial spaces',
    isActive: true,
    order: 3
  });

  await Service.insertMany([
    {
      categoryId: furnitureCategory._id,
      name: 'Modular Kitchen',
      slug: 'modular-kitchen-charkhi-dadri',
      emoji: '🍽️',
      shortDescription: 'Modern modular kitchen solutions',
      fullDescription: 'Luxury modular kitchen design, manufacturing, and installation with premium finishes and practical storage planning.',
      images: [],
      popular: true,
      featured: true,
      priceStarting: 'Custom quote',
      seoTitle: 'Best Modular Kitchen in Charkhi Dadri',
      seoDescription: 'Modern modular kitchen design and installation in Charkhi Dadri, Haryana.',
      tags: ['kitchen', 'furniture', 'interior'],
      faq: [
        {
          question: 'Do you provide custom modular kitchen design?',
          answer: 'Yes, every kitchen is measured and designed according to the available space and customer requirements.'
        }
      ],
      isActive: true
    },
    {
      categoryId: constructionCategory._id,
      name: 'Complete House Construction',
      slug: 'complete-house-construction-charkhi-dadri',
      emoji: '🏠',
      shortDescription: 'End-to-end home construction from foundation to finishing',
      fullDescription: 'Complete house construction with planning, material coordination, civil work, finishing, and contractor management.',
      images: [],
      popular: true,
      featured: true,
      priceStarting: 'Site visit required',
      seoTitle: 'Complete House Construction in Charkhi Dadri',
      seoDescription: 'Trusted contractor for complete house construction in Charkhi Dadri and Haryana.',
      tags: ['construction', 'contractor', 'house'],
      faq: [],
      isActive: true
    },
    {
      categoryId: furnitureCategory._id,
      name: 'Custom Wardrobe',
      slug: 'custom-wardrobe-charkhi-dadri',
      emoji: '🚪',
      shortDescription: 'Premium wardrobe manufacturing for modern homes',
      fullDescription: 'Custom wardrobe design and manufacturing with sliding, hinged, and modular storage options.',
      images: [],
      popular: true,
      featured: false,
      priceStarting: 'Custom quote',
      seoTitle: 'Custom Wardrobe in Charkhi Dadri',
      seoDescription: 'Premium custom wardrobe manufacturing services in Charkhi Dadri.',
      tags: ['wardrobe', 'furniture', 'storage'],
      faq: [],
      isActive: true
    },
    {
      categoryId: interiorCategory._id,
      name: 'Modern Interior Solutions',
      slug: 'modern-interior-solutions-charkhi-dadri',
      emoji: '✨',
      shortDescription: 'Elegant interior solutions for home and commercial spaces',
      fullDescription: 'Modern interior planning, furniture placement, finishing, and decor-focused execution.',
      images: [],
      popular: false,
      featured: true,
      priceStarting: 'Custom quote',
      seoTitle: 'Modern Interior Solutions in Charkhi Dadri',
      seoDescription: 'Premium interior solutions and furnishing services in Haryana.',
      tags: ['interior', 'design', 'furnishing'],
      faq: [],
      isActive: true
    }
  ]);

  console.log('Catalog seeded successfully');
  await mongoose.disconnect();
};

seedCatalog().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
