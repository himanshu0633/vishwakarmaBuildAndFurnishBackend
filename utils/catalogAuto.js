const slugify = require('./slugify');
const { getServiceAliases } = require('./searchAliases');

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
  const aliases = getServiceAliases(name).slice(0, 30);

  return unique([
    baseName,
    ...words,
    ...categoryWords,
    ...aliases,
    `${baseName} images`,
    `latest ${baseName} design`,
    `best ${baseName} in ${CITY.toLowerCase()}`,
    'interior',
    CITY.toLowerCase()
  ]);
};

const buildServiceAutoFields = (name = '', categoryName = '') => {
  const aliases = getServiceAliases(name).slice(0, 8);
  const aliasText = aliases.length ? ` Also searched as ${aliases.join(', ')}.` : '';

  return {
    slug: `${slugify(name)}-${slugify(CITY)}`,
    seoTitle: `Best ${titleCase(name)} in ${CITY} | ${BUSINESS_NAME}`,
    seoDescription: `Luxury ${name.toLowerCase()} solutions in ${CITY} with premium materials, latest designs, images, and modern finishing.${aliasText}`.slice(0, 300),
    tags: buildServiceTags(name, categoryName),
    isActive: true
  };
};

module.exports = {
  BUSINESS_NAME,
  CITY,
  buildCategoryAutoFields,
  buildServiceAutoFields,
  buildServiceTags,
  titleCase
};
