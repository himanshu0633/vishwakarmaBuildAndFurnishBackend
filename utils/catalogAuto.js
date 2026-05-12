const slugify = require('./slugify');

const BUSINESS_NAME = 'Vishwakarma Build & Furnish CKD';
const CITY = 'Charkhi Dadri';

const titleCase = (value = '') =>
  value
    .toString()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const unique = (items = []) => [...new Set(items.filter(Boolean))];

const buildCategoryAutoFields = (name = '') => ({
  slug: slugify(name),
  seoTitle: `${name} in ${CITY} | ${BUSINESS_NAME}`,
  seoDescription: `Premium ${name} in ${CITY} with expert craftsmanship and modern designs.`,
  isActive: true
});

const buildServiceTags = (name = '', categoryName = '') => {
  const baseName = name.toLowerCase().trim();
  const words = baseName.split(/\s+/).filter(Boolean);
  const categoryWords = categoryName
    .toLowerCase()
    .replace(/services|solutions/g, '')
    .split(/\s+/)
    .filter(Boolean);

  return unique([
    baseName,
    ...words,
    ...categoryWords,
    'interior',
    CITY.toLowerCase()
  ]);
};

const buildServiceAutoFields = (name = '', categoryName = '') => ({
  slug: `${slugify(name)}-${slugify(CITY)}`,
  seoTitle: `Best ${titleCase(name)} in ${CITY} | ${BUSINESS_NAME}`,
  seoDescription: `Luxury ${name.toLowerCase()} solutions in ${CITY} with premium materials and modern designs.`,
  tags: buildServiceTags(name, categoryName),
  isActive: true
});

module.exports = {
  BUSINESS_NAME,
  CITY,
  buildCategoryAutoFields,
  buildServiceAutoFields,
  buildServiceTags,
  titleCase
};
