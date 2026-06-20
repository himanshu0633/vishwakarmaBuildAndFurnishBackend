const express = require('express');
const AboutContent = require('../models/AboutContent');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const defaultSections = [
  {
    key: 'hero',
    kicker: 'About Us',
    title: 'About Vishwakarma Build & Furnish',
    text: 'Serving Charkhi Dadri Since 2003 With Trusted Construction, Interior & Custom Furniture Solutions.',
    text2: 'From Foundation to Furniture - We Build Quality That Lasts.',
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'
  },
  {
    key: 'history',
    kicker: 'Company History',
    title: 'Trusted Workmanship Since 2003',
    text: 'Vishwakarma Build & Furnish has been serving Charkhi Dadri and nearby areas since 2003. Founded by Sunil Jangra, our company specializes in construction work, interior solutions, and custom furniture manufacturing.',
    text2: "We undertake both government and private projects with professionalism and quality workmanship."
  },
  {
    key: 'quality',
    kicker: 'Material Transparency',
    title: 'Quality Depends On Your Selected Budget',
    text: "The quality of material always depends on the customer's selected budget. Premium quality materials provide better durability and long-lasting performance.",
    text2: 'We guide every client before starting the project, so the final work matches the design, budget, and expected durability.'
  },
  {
    key: 'factory',
    kicker: 'Why Clients Trust Us',
    title: 'Why Our Work Stands Out',
    text: 'Our craftsmen and workers are skilled in furniture and construction work. We work with advanced manufacturing support and modern machinery for customized designs with high finishing quality.',
    text2: "Whether it is a modular kitchen, wardrobe, sofa, or house construction project, we deliver work according to the client's expectations.",
    image: 'https://images.pexels.com/photos/5974255/pexels-photo-5974255.jpeg'
  },
  {
    key: 'warranty',
    kicker: 'Quality Assurance',
    title: 'Built For Trust And Customer Satisfaction',
    text: 'We focus on providing durable and reliable work. Depending on selected materials and project type, we provide quality assurance and long-lasting solutions.',
    text2: 'Our goal is not just to complete projects, but to build trust and customer satisfaction through strong workmanship and premium finishing.'
  },
  {
    key: 'experience',
    kicker: 'Experience',
    title: 'Local Team For Homes, Shops And Projects',
    text: 'Our experience covers house construction, renovation, modular kitchen, wardrobes, doors, windows, wall panels, false ceiling, furniture manufacturing, and complete interior finishing.',
    text2: 'We serve Charkhi Dadri along with Bhiwani, Mahendragarh, Rewari, Rohtak, Jhajjar, and nearby villages.'
  },
  {
    key: 'cta',
    kicker: 'Contact Details',
    title: "Let's Build Your Dream Space Together",
    text: 'Call us for construction, interiors, custom furniture, modular kitchen, wardrobes, sofa sets, and complete turnkey work.',
    text2: 'Charkhi Dadri, Haryana'
  }
];

const defaultWorkshopPhotos = [
  { title: 'Workshop', image: 'https://images.pexels.com/photos/5974255/pexels-photo-5974255.jpeg' },
  { title: 'Workers', image: 'https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg' },
  { title: 'Construction Sites', image: 'https://images.pexels.com/photos/5323962/pexels-photo-5323962.jpeg' },
  { title: 'Furniture Manufacturing', image: 'https://images.pexels.com/photos/5974300/pexels-photo-5974300.jpeg' },
  { title: 'Completed Interiors', image: 'https://images.pexels.com/photos/7516077/pexels-photo-7516077.png' }
];

const defaultTeamPhotos = [
  { title: 'Site Planning Team', image: 'https://images.pexels.com/photos/8961065/pexels-photo-8961065.jpeg' },
  { title: 'Furniture Workshop Team', image: 'https://images.pexels.com/photos/5974255/pexels-photo-5974255.jpeg' },
  { title: 'Interior Execution Team', image: 'https://images.pexels.com/photos/5974300/pexels-photo-5974300.jpeg' }
];

const defaultServiceAreas = [
  'Charkhi Dadri',
  'Bhiwani',
  'Mahendragarh',
  'Rewari',
  'Rohtak',
  'Jhajjar',
  'Nearby villages'
];

const defaults = {
  sections: defaultSections,
  workshopPhotos: defaultWorkshopPhotos,
  teamPhotos: defaultTeamPhotos,
  serviceAreas: defaultServiceAreas,
  phone: '9416856468',
  location: 'Charkhi Dadri, Haryana'
};

const normalizePhotos = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        title: String(item?.title || '').trim(),
        image: String(item?.image || '').trim()
      }))
      .filter((item) => item.title || item.image);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => {
        const [title, ...imageParts] = line.split('|');
        return {
          title: String(title || '').trim(),
          image: imageParts.join('|').trim()
        };
      })
      .filter((item) => item.title || item.image);
  }

  return [];
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const withDefaults = (content) => {
  const raw = content?.toObject ? content.toObject() : content;
  const byKey = new Map((raw?.sections || []).map((section) => [section.key, section]));

  return {
    ...defaults,
    ...raw,
    sections: defaultSections.map((section) => ({ ...section, ...(byKey.get(section.key) || {}) })),
    workshopPhotos: raw?.workshopPhotos?.length ? raw.workshopPhotos : defaultWorkshopPhotos,
    teamPhotos: raw?.teamPhotos?.length ? raw.teamPhotos : defaultTeamPhotos,
    serviceAreas: raw?.serviceAreas?.length ? raw.serviceAreas : defaultServiceAreas,
    phone: raw?.phone || defaults.phone,
    location: raw?.location || defaults.location
  };
};

router.get('/', async (req, res) => {
  try {
    const content = await AboutContent.findOne().sort({ updatedAt: -1 });
    res.json({
      success: true,
      data: withDefaults(content)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching about content', error: error.message });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const payload = {
      sections: Array.isArray(req.body.sections) ? req.body.sections : defaults.sections,
      workshopPhotos: normalizePhotos(req.body.workshopPhotos),
      teamPhotos: normalizePhotos(req.body.teamPhotos),
      serviceAreas: normalizeList(req.body.serviceAreas),
      phone: String(req.body.phone || defaults.phone).trim(),
      location: String(req.body.location || defaults.location).trim()
    };

    const existing = await AboutContent.findOne().sort({ updatedAt: -1 });
    const content = existing
      ? await AboutContent.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true })
      : await AboutContent.create(payload);

    res.json({
      success: true,
      data: withDefaults(content),
      message: 'About content updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating about content', error: error.message });
  }
});

module.exports = router;
