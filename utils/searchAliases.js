const normalize = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const unique = (items = []) => [...new Set(items.map((item) => item?.toString().trim()).filter(Boolean))];

const aliasGroups = [
  {
    targetKeywords: ['wooden doors', 'wooden door', 'door'],
    aliases: [
      'darwaza', 'darwaja', 'darvaza', 'darvaja', 'drwaza', 'drwaja', 'darwaaza', 'darwaaja',
      'darwaze', 'darwaaze', 'dervaza', 'derwaza', 'darwza', 'darvza', 'gate', 'main door',
      'entrance', 'entry gate', 'wooden door'
    ]
  },
  {
    targetKeywords: ['wooden windows', 'wooden window', 'window'],
    aliases: [
      'khidki', 'khirki', 'khidkee', 'khidkey', 'khirkee', 'khirkey', 'khidkii', 'khidqi',
      'khidky', 'khidkie', 'khirkii', 'khidkiya', 'window', 'windows'
    ]
  },
  {
    targetKeywords: ['ply board door', 'plyboard door'],
    aliases: [
      'ply door', 'plydoor', 'plywood door', 'plyboard door', 'flush door', 'laminate door',
      'designer door', 'interior door', 'modular door', 'panel door', 'veneer door',
      'pvc coated door', 'decorative door', 'engineered wood door', 'readymade door',
      'bedroom door', 'office door', 'plywood darwaza', 'wooden darwaza',
      'flush darwaz', 'laminate darwaza', 'designer darwaza'
    ]
  },
  {
    targetKeywords: ['modular kitchen', 'kitchen'],
    aliases: [
      'modern kitchen', 'smart kitchen', 'designer kitchen', 'luxury kitchen', 'premium kitchen',
      'fitted kitchen', 'customized kitchen', 'contemporary kitchen', 'interior kitchen',
      'kitchen setup', 'kitchen design', 'kitchen solution', 'kitchen studio', 'kitchen decor',
      'wooden kitchen', 'pvc kitchen', 'acrylic kitchen', 'aluminium kitchen', 'italian kitchen',
      'moduler kitchen', 'modlar kitchen', 'modular kichen', 'modern rasoi', 'smart rasoi',
      'kitchen wala setup', 'designer rasoi', 'rasoi'
    ]
  },
  {
    targetKeywords: ['wardrobe', 'sliding wardrobe', 'custom wardrobe'],
    aliases: [
      'wardrob', 'wardrope', 'wadrobe', 'wardrobe cabinet', 'closet', 'cupboard', 'almirah',
      'almari', 'sliding wardrobe', 'modular wardrobe', 'designer wardrobe', 'wooden wardrobe',
      'luxury wardrobe', 'smart wardrobe', 'storage cabinet', 'dressing wardrobe', 'almeera',
      'almira', 'kapdo ki almari'
    ]
  },
  {
    targetKeywords: ['tv unit', 'tv panel design', 'tv panel'],
    aliases: [
      'tv cabinet', 'tv panel', 'entertainment unit', 'tv stand', 'tv console', 'wall unit',
      'media unit', 'entertainment console', 'tv wall panel', 'designer tv unit',
      'modular tv unit', 'wooden tv unit', 'led panel', 'led unit', 'wall mounted tv unit',
      'modern tv unit', 'luxury tv unit', 'tv unitt', 'tv panal', 'tv cabnit', 'tv standd',
      'led panal', 'tv wall', 'tv setup'
    ]
  },
  {
    targetKeywords: ['glass work', 'mirror'],
    aliases: [
      'mirror', 'sheesha', 'shesha', 'shisha', 'sheesa', 'glass mirror', 'looking mirror',
      'dressing mirror', 'wall mirror', 'vanity mirror', 'decorative mirror', 'designer mirror',
      'full length mirror', 'bathroom mirror', 'modern mirror', 'led mirror', 'frameless mirror',
      'wall glass', 'reflective glass', 'miror', 'mirorr', 'morror', 'glass'
    ]
  },
  {
    targetKeywords: ['bed', 'double bed', 'hydraulic bed'],
    aliases: [
      'wooden bed', 'single bed', 'king size bed', 'queen size bed', 'hydraulic bed',
      'storage bed', 'designer bed', 'luxury bed', 'modern bed', 'sofa cum bed', 'bunk bed',
      'kids bed', 'cot', 'bedroom set', 'platform bed', 'upholstered bed', 'box bed',
      'bedd', 'beed', 'wooden bedd', 'double bedd', 'bed set', 'palang', 'khat', 'beddroom bed'
    ]
  },
  {
    targetKeywords: ['house construction', 'complete house construction', 'construction'],
    aliases: [
      'home construction', 'building construction', 'civil construction', 'residential construction',
      'turnkey construction', 'dream home construction', 'home building', 'property construction',
      'construction work', 'building solutions', 'home development', 'structure work',
      'interior construction', 'architecture construction', 'house constraction',
      'home constraction', 'ghar banana', 'makaan construction', 'building work',
      'civil work', 'ghar ka kaam'
    ]
  },
  {
    targetKeywords: ['electrical work', 'electrical'],
    aliases: [
      'electric work', 'electrical services', 'electrical installation', 'wiring work',
      'house wiring', 'commercial wiring', 'industrial electrical work', 'power solutions',
      'electrical maintenance', 'electric fitting', 'switch board work', 'lighting work',
      'cctv electrical work', 'smart electrical solutions', 'electical work', 'bijli ka kaam',
      'wiring fitting', 'light fitting', 'board fitting'
    ]
  },
  {
    targetKeywords: ['paint work', 'paint'],
    aliases: [
      'painting work', 'wall painting', 'interior painting', 'exterior painting', 'texture paint',
      'wall finish', 'decorative paint', 'home painting', 'building painting', 'spray painting',
      'designer paint work', 'waterproof paint work', 'putty paint work', 'color coating',
      'premium paint finish', 'painting ka kaam', 'rang rogan', 'color work', 'wall color',
      'paintig work', 'painter work'
    ]
  },
  {
    targetKeywords: ['plumbing', 'plumbing work'],
    aliases: [
      'plumbing services', 'pipe fitting', 'water pipeline work', 'sanitary work',
      'bathroom fitting', 'water connection work', 'drainage work', 'pipe installation',
      'water system setup', 'bathroom plumbing', 'kitchen plumbing', 'plumbing maintenance',
      'plumbing solutions', 'plumber work', 'paani ki line ka kaam', 'nal ka kaam', 'pipe work'
    ]
  },
  {
    targetKeywords: ['tiles work', 'marble work', 'tiles', 'marble'],
    aliases: [
      'tile installation', 'marble installation', 'flooring work', 'granite work', 'stone work',
      'floor tile work', 'wall tile work', 'italian marble work', 'designer flooring',
      'tile fitting', 'marble fitting', 'luxury flooring', 'wall cladding work', 'stone flooring',
      'farsh ka kaam', 'pathar work', 'tailes work', 'marbal work', 'flooring ka kaam'
    ]
  }
];

const getServiceAliases = (name = '') => {
  const normalizedName = normalize(name);
  const matches = aliasGroups
    .filter((group) => group.targetKeywords.some((keyword) => normalizedName.includes(normalize(keyword))))
    .flatMap((group) => group.aliases);

  return unique(matches);
};

module.exports = {
  aliasGroups,
  getServiceAliases
};
