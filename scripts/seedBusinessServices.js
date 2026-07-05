const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');
const { buildServiceAutoFields } = require('../utils/catalogAuto');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const serviceMediaPools = {
  'wooden-work-services': [
    '/uploads/services/service-1778313028408-572604629.png',
    '/uploads/services/service-1778318103597-311567816.jpg',
    '/uploads/services/service-1778318503449-38707768.png',
    '/uploads/services/service-1778318612940-539670443.png',
    '/uploads/services/service-1778318707521-159354051.png',
    '/uploads/services/service-1778319238096-389847607.png',
    '/uploads/services/service-1778320076164-69983167.png',
    '/uploads/services/service-1778320539413-147282760.png',
    '/uploads/services/service-1778320666165-164821877.png',
    '/uploads/services/service-1778320766227-819047316.png',
    '/uploads/services/service-1778320859571-721423300.png',
    '/uploads/services/service-1778320967895-144352592.png',
    '/uploads/services/service-1778321073566-960284640.png',
    '/uploads/services/service-1778321155334-613312876.png',
    '/uploads/services/service-1778321247668-982289621.png',
    '/uploads/services/service-1778321506645-669402337.png',
    '/uploads/services/service-1778321816205-468892235.png',
    '/uploads/services/service-1778322020762-994268796.png',
    '/uploads/services/service-1778322898784-742772367.png',
    '/uploads/services/service-1778323023528-938560568.png',
    '/uploads/services/service-1778323142548-890185675.png',
    '/uploads/services/service-1778323203006-727897366.png',
    '/uploads/services/service-1778323250507-968943790.png',
    '/uploads/services/service-1778323479010-22406135.png'
  ],
  'construction-services': [
    '/uploads/services/service-1778323595757-336505731.png',
    '/uploads/services/service-1778324296375-357124452.png',
    '/uploads/services/service-1778324475033-404757669.png',
    '/uploads/services/service-1778324688633-273387250.png',
    '/uploads/services/service-1778331078211-803668436.png',
    '/uploads/services/service-1778334916286-751475471.jpg',
    '/uploads/services/service-1778334916287-448620259.jpg',
    '/uploads/services/service-1778334916289-681122555.jpg',
    '/uploads/services/service-1778334916290-11240705.jpg',
    '/uploads/services/service-1778334916293-808452414.jpg',
    '/uploads/services/service-1778334916294-112933330.jpg',
    '/uploads/services/service-1778334916294-741416269.jpg'
  ],
  'interior-services': [
    '/uploads/services/service-1778334916296-533906718.jpg',
    '/uploads/services/service-1778334916297-417836069.jpg',
    '/uploads/services/service-1778334916297-451792676.jpg',
    '/uploads/services/service-1778334916297-748650356.jpg',
    '/uploads/services/service-1778334916298-193264245.jpg',
    '/uploads/services/service-1778334916298-646515120.jpg',
    '/uploads/services/service-1778581763987-169674416.png',
    '/uploads/services/service-1778582162920-185677714.png',
    '/uploads/services/service-1778582553283-206475757.png',
    '/uploads/services/service-1778582562710-446984698.png',
    '/uploads/services/service-1778584433771-802882379.png'
  ]
};

const serviceGroups = [
  {
    categorySlug: 'wooden-work-services',
    services: [
      'Wooden Doors',
      'Wooden Windows',
      'Ply Board Door',
      'Wooden Jali single-double Doors',
      'PVC Panels',
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

const customDescriptions = {
  'Wooden Doors': {
    short: 'Premium quality teak and hardwood doors customized for your home. Available in modern designs with a termite-resistant neat finish.',
    full: 'Get high-quality customized teak and hardwood wooden doors from Vishwakarma Build & Furnish. Our doors are crafted using seasoned wood, termite-resistant treatment, and premium polishing to ensure long-lasting durability and a majestic look for your home.'
  },
  'Wooden Windows': {
    short: 'High durability wooden windows designed for optimal ventilation, natural light, and elegant aesthetics.',
    full: 'Premium wooden window frame manufacturing and shutter installation. Using seasoned wood and durable hardware accessories to withstand all seasons.'
  },
  'Ply Board Door': {
    short: 'Durable flush doors and ply board doors with premium laminate finishing options.',
    full: 'Custom ply board and flush door installation services. Finished with premium laminates or veneers, providing moisture resistance and high load bearing strength.'
  },
  'Wooden Jali single-double Doors': {
    short: 'Beautiful wooden jali doors designed for ventilation and home security with mesh setups.',
    full: 'Custom teak wood jali doors for main entrance and interior setups. Designed with high-density wire mesh for premium safety, ventilation, and traditional elegance.'
  },
  'PVC Panels': {
    short: 'Durable and waterproof PVC wall and ceiling panels, perfect for moisture resistance and modern interior walls.',
    full: 'Durable, moisture-proof, and modern PVC panel installations for walls and ceilings. Ideal for damp walls and quick, elegant renovations.'
  },
  'Double Bed': {
    short: 'Custom manufactured double beds with optional hydraulic storage and premium headboards.',
    full: 'Sturdy and beautiful designer double beds customized to your size. Choose from premium upholstery, storage options, and long-lasting hardwood structural frames.'
  },
  'Modular Kitchen': {
    short: 'Maximize your kitchen space with our modern modular kitchen layouts, smart chimneys, and durable soft-close cabinets.',
    full: 'Transform your cooking space with luxury modular kitchens from Vishwakarma Build & Furnish. We offer custom L-shaped, U-shaped, and parallel layouts using marine grade waterproof plywood, high-quality acrylic finishes, modern pull-out drawers, and premium soft-close hinges.'
  },
  'House Construction': {
    short: 'End-to-end premium house construction contractor services with total transparency.',
    full: 'Get complete peace of mind with our house construction services. We handle everything from foundation work, structural RCC casting, brickwork, plastering, to final finishing, plumbing, and electrical works.'
  },
  'False Ceiling': {
    short: 'Elegant POP and PVC false ceiling designs with integrated LED lighting setup to elevate your living room look.',
    full: 'Elevate your interior design with custom POP and PVC false ceilings by Vishwakarma Build & Furnish. We specialize in contemporary designs with integrated LED strip lighting, profile lights, and clean finishing that adds modern luxury to your living rooms and bedrooms.'
  },
  'Luxury Interior Design': {
    short: 'Full-service luxury home interior planning and execution by expert designers.',
    full: 'Turn your house into a dream home with our complete interior design services. We provide custom space planning, 3D design visualizations, false ceilings, lighting layouts, and bespoke furniture coordination.'
  },
  'Sofa Set': {
    short: 'Luxury sofa sets customized in premium fabrics, high-density foam, and designer looks.',
    full: 'Elegant custom-built sofas and couches for your living room. We use premium high-density foam for long-lasting comfort and high-quality upholstery fabrics.'
  },
  'Wardrobe': {
    short: 'Smart spacious wardrobe solutions with custom shelving and premium sliding doors.',
    full: 'Maximize your bedroom storage with custom wardrobes. Featuring modern sliding doors, built-in organizers, drawer locks, and premium laminate or acrylic finishes.'
  }
};

const buildShortDescription = (name, categoryName) => {
  if (customDescriptions[name]) {
    return customDescriptions[name].short;
  }
  return `Premium ${name.toLowerCase()} service for ${categoryName.toLowerCase()} in Charkhi Dadri.`;
};

const buildFullDescription = (name, categoryName) => {
  if (customDescriptions[name]) {
    return customDescriptions[name].full;
  }
  return `Get professional ${name.toLowerCase()} service by Vishwakarma Build & Furnish. We provide expert planning, quality materials, skilled workmanship, and modern finishing for ${categoryName.toLowerCase()} projects in Charkhi Dadri and nearby Haryana areas.`;
};

const priorityServices = [
  'Wooden Doors',
  'Wooden Windows',
  'Ply Board Door',
  'Wooden Jali single-double Doors',
  'PVC Panels',
  'Double Bed',
  'Modular Kitchen',
  'House Construction',
  'False Ceiling',
  'Luxury Interior Design'
];

const buildMediaPayload = (categorySlug, index) => {
  const pool = serviceMediaPools[categorySlug] || [];

  if (!pool.length) {
    return {
      heroImage: '',
      images: [],
      beforeImages: [],
      afterImages: [],
      videos: []
    };
  }

  const images = [0, 1, 2]
    .map(offset => pool[(index + offset) % pool.length])
    .filter(Boolean);

  return {
    heroImage: images[0] || '',
    images,
    beforeImages: images[1] ? [images[1]] : [],
    afterImages: images[2] ? [images[2]] : [],
    videos: []
  };
};

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
        ...buildMediaPayload(group.categorySlug, index),
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
