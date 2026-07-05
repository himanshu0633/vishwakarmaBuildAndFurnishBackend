const dotenv = require('dotenv');
const mongoose = require('mongoose');
require('../models/Category');
const Service = require('../models/Service');
const { buildServiceTags } = require('../utils/catalogAuto');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/industrial-equipment-solutions';

const unique = (items = []) => [...new Set(
  items
    .map(item => String(item || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
)];

const updateServiceSeoTags = async () => {
  await mongoose.connect(MONGODB_URI);

  const services = await Service.find({})
    .populate('categoryId', 'name')
    .sort({ name: 1 });

  let updated = 0;

  for (const service of services) {
    const generatedTags = buildServiceTags(service.name, service.categoryId?.name || '');
    const tags = unique([...(service.tags || []), ...generatedTags]);

    service.tags = tags;
    await service.save();
    updated += 1;
  }

  console.log(`Service SEO tags updated. Services: ${updated}`);
  await mongoose.disconnect();
};

updateServiceSeoTags().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
