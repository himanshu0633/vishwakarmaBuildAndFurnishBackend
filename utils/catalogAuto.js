const slugify = require('./slugify');
const { getServiceAliases } = require('./searchAliases');

const BUSINESS_NAME = 'Vishwakarma Build & Furnish';
const CITY = 'Charkhi Dadri';

const titleCase = (value = '') =>
  value
    .toString()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const unique = (items = []) => [...new Set(
  items
    .map(item => String(item || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
)];

const buildCategoryAutoFields = (name = '') => ({
  slug: slugify(name),
  seoTitle: `${name} in ${CITY} | ${BUSINESS_NAME}`,
  seoDescription: `Premium ${name} in ${CITY} with expert craftsmanship and modern designs.`,
  isActive: true
});

const buildServiceTags = (name = '', categoryName = '') => {
  const baseName = name.toLowerCase().trim();
  const displayName = titleCase(name);
  const words = baseName.split(/\s+/).filter(Boolean);
  const categoryWords = categoryName
    .toLowerCase()
    .replace(/services|solutions/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const aliases = getServiceAliases(name).slice(0, 30);
  const localAreas = [
    CITY.toLowerCase(),
    'dadri',
    'bhiwani',
    'haryana',
    'near me'
  ];
  const year = '2026';
  const servicePhrases = [
    baseName,
    `${baseName} service`,
    `${baseName} services`,
    `${baseName} work`,
    `${baseName} contractor`,
    `${baseName} design`,
    `${baseName} designs`,
    `${baseName} latest design`,
    `${baseName} modern design`,
    `${baseName} images`,
    `${baseName} image`,
    `${baseName} photos`,
    `${baseName} photo`,
    `${baseName} gallery`,
    `${baseName} price`,
    `${baseName} cost`,
    `${baseName} ideas`,
    `${baseName} inspiration`,
    `best ${baseName}`,
    `best ${baseName} service`,
    `best ${baseName} services`,
    `best ${baseName} contractor`,
    `best ${baseName} design`,
    `best ${baseName} images`,
    `best ${baseName} image`,
    `latest ${baseName}`,
    `latest ${baseName} design`,
    `latest ${baseName} images`,
    `modern ${baseName}`,
    `modern ${baseName} design`,
    `${baseName} ${year}`,
    `${baseName} service ${year}`,
    `${baseName} design ${year}`,
    `${baseName} designs ${year}`,
    `${baseName} image ${year}`,
    `${baseName} images ${year}`,
    `best ${baseName} ${year}`,
    `best ${baseName} service ${year}`,
    `best ${baseName} design ${year}`,
    `best ${baseName} image ${year}`,
    `best ${baseName} images ${year}`,
    `latest ${baseName} design ${year}`,
    `latest ${baseName} images ${year}`,
    `${displayName} ${year}`,
    `Best ${displayName} Service ${year}`,
    `Best ${displayName} Image ${year}`
  ];

  return unique([
    baseName,
    ...words,
    ...categoryWords,
    ...aliases,
    ...servicePhrases,
    ...localAreas.flatMap(area => [
      `${baseName} in ${area}`,
      `${baseName} service in ${area}`,
      `best ${baseName} in ${area}`,
      `best ${baseName} service in ${area}`,
      `${baseName} images in ${area}`,
      `${baseName} design in ${area}`,
      `${baseName} ${year} in ${area}`,
      `best ${baseName} image ${year} in ${area}`
    ]),
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
