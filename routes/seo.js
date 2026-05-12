const express = require('express');
const Blog = require('../models/Blog');
const Service = require('../models/Service');
const Category = require('../models/Category');

const router = express.Router();

const siteUrl = () =>
  (process.env.SITE_URL || process.env.FRONTEND_URL || 'https://vishwakarma-build-and-furnish.vercel.app')
    .replace(/\/+$/, '');

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const sitemapUrl = ({ loc, lastmod, changefreq = 'weekly', priority = '0.7', images = [], assetOrigin = '' }) => {
  const imageXml = images
    .filter(Boolean)
    .map((image) => {
      const imageUrl = /^https?:\/\//i.test(image)
        ? image
        : `${assetOrigin}${image.startsWith('/') ? image : `/${image}`}`;

      return `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
    </image:image>`;
    })
    .join('');

  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod || new Date().toISOString())}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageXml}
  </url>`;
};

router.get('/robots.txt', (req, res) => {
  const origin = siteUrl();

  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${origin}/sitemap.xml`
  ].join('\n'));
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const origin = siteUrl();
    const assetOrigin = (process.env.BACKEND_URL || process.env.API_ORIGIN || origin).replace(/\/+$/, '');
    const [categories, services, blogs] = await Promise.all([
      Category.find({ isActive: true }).select('slug updatedAt'),
      Service.find({ isActive: true }).select('slug categoryId heroImage images updatedAt').populate('categoryId', 'slug'),
      Blog.find({ isActive: true }).select('slug coverImage updatedAt publishedAt')
    ]);

    const staticPages = ['/', '/services', '/blogs', '/gallery', '/about', '/contact'].map((path) =>
      sitemapUrl({
        loc: `${origin}${path}`,
        changefreq: path === '/' ? 'daily' : 'weekly',
        priority: path === '/' ? '1.0' : '0.8'
      })
    );

    const categoryPages = categories.map((category) =>
      sitemapUrl({
        loc: `${origin}/services/${category.slug}`,
        lastmod: category.updatedAt?.toISOString(),
        priority: '0.8'
      })
    );

    const servicePages = services.map((service) =>
      sitemapUrl({
        loc: `${origin}/services/${service.categoryId?.slug || 'furniture'}/${service.slug}`,
        lastmod: service.updatedAt?.toISOString(),
        priority: '0.9',
        images: [service.heroImage, ...(service.images || [])].slice(0, 10),
        assetOrigin
      })
    );

    const blogPages = blogs.map((blog) =>
      sitemapUrl({
        loc: `${origin}/blogs/${blog.slug}`,
        lastmod: (blog.updatedAt || blog.publishedAt)?.toISOString(),
        priority: '0.85',
        images: [blog.coverImage],
        assetOrigin
      })
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${[
      ...staticPages,
      ...categoryPages,
      ...servicePages,
      ...blogPages
    ].join('')}
</urlset>`;

    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
