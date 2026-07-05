const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const media = {
  furniture: [
    '/uploads/services/service-1778313028408-572604629.png',
    '/uploads/services/service-1778318103597-311567816.jpg',
    '/uploads/services/service-1778318503449-38707768.png'
  ],
  construction: [
    '/uploads/services/service-1778323595757-336505731.png',
    '/uploads/services/service-1778334916286-751475471.jpg',
    '/uploads/services/service-1778334916287-448620259.jpg'
  ],
  interior: [
    '/uploads/services/service-1778334916296-533906718.jpg',
    '/uploads/services/service-1778581763987-169674416.png',
    '/uploads/services/service-1778584433771-802882379.png'
  ],
  wardrobe: [
    '/uploads/services/service-1778321073566-960284640.png',
    '/uploads/services/service-1778321155334-613312876.png',
    '/uploads/services/service-1778321247668-982289621.png'
  ]
};

const buildMediaFields = (images = []) => ({
  heroImage: images[0] || '',
  images,
  beforeImages: images[1] ? [images[1]] : [],
  afterImages: images[2] ? [images[2]] : [],
  videos: []
});

const seedCatalog = async () => {
  await mongoose.connect(MONGODB_URI);

  await Service.deleteMany({});
  await Category.deleteMany({});

  const furnitureCategory = await Category.create({
    name: 'wooden work Services',
    slug: 'wooden-work-services',
    emoji: '🛋️',
    icon: '🛋️',
    description: 'Custom furniture manufacturing services',
    image: media.furniture[0],
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
    image: media.construction[0],
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
    image: media.interior[0],
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
      ...buildMediaFields(media.furniture),
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
      ...buildMediaFields(media.construction),
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
      ...buildMediaFields(media.wardrobe),
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
      ...buildMediaFields(media.interior),
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
