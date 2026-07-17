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
      'entrance', 'entry gate', 'wooden door', 'lakdi ka darwaza', 'lakdi ke darwaze',
      'lakdi darwaza', 'lakdi door', 'lakdi ka door', 'wood ka darwaza',
      'darwaza banane wala', 'lakdi ka darwaza banane wala', 'door banane wala',
      'darwaze ka kaam', 'darwaza ka kaam karne wala', 'wooden door manufacturer',
      'main gate', 'wooden entrance door', 'designer wooden door', 'solid wood door',
      'door manufacturer charkhi dadri', 'wooden door near me', 'door maker',
      'custom door manufacturer', 'wooden doors charkhi dadri'
    ]
  },
  {
    targetKeywords: ['wooden windows', 'wooden window', 'window'],
    aliases: [
      'khidki', 'khirki', 'khidkee', 'khidkey', 'khirkee', 'khirkey', 'khidkii', 'khidqi',
      'khidky', 'khidkie', 'khirkii', 'khidkiya', 'window', 'windows',
      'lakdi ki khidki', 'lakdi window', 'khidki banane wala', 'window banane wala',
      'khidki ka kaam', 'khidki ka kaam karne wala', 'wooden window manufacturer',
      'custom wooden windows', 'window maker', 'window contractor',
      'window manufacturer charkhi dadri', 'wooden window near me'
    ]
  },
  {
    targetKeywords: ['ply board door', 'plyboard door'],
    aliases: [
      'ply door', 'plydoor', 'plywood door', 'plyboard door', 'flush door', 'laminate door',
      'designer door', 'interior door', 'modular door', 'panel door', 'veneer door',
      'pvc coated door', 'decorative door', 'engineered wood door', 'readymade door',
      'bedroom door', 'office door', 'plywood darwaza', 'wooden darwaza',
      'flush darwaz', 'laminate darwaza', 'designer darwaza', 'ply ka darwaza',
      'plywood ka darwaza', 'ply door banane wala', 'ply board ka kaam',
      'ply board door banane wala'
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
      'kitchen wala setup', 'designer rasoi', 'rasoi', 'rasoi banane wala',
      'kitchen banane wala', 'modular kitchen banane wala', 'rasoi ka kaam',
      'kitchen ka kaam karne wala', 'modular kitchen charkhi dadri',
      'modular kitchen near me', 'kitchen designer charkhi dadri',
      'kitchen contractor charkhi dadri', 'best modular kitchen', 'custom kitchen',
      'kitchen maker', 'kitchen renovation', 'kitchen designer', 'kitchen contractor',
      'kitchen cabinet maker', 'kitchen interior designer'
    ]
  },
  {
    targetKeywords: ['wardrobe', 'sliding wardrobe', 'custom wardrobe'],
    aliases: [
      'wardrob', 'wardrope', 'wadrobe', 'wardrobe cabinet', 'closet', 'cupboard', 'almirah',
      'almari', 'sliding wardrobe', 'modular wardrobe', 'designer wardrobe', 'wooden wardrobe',
      'luxury wardrobe', 'smart wardrobe', 'storage cabinet', 'dressing wardrobe', 'almeera',
      'almira', 'kapdo ki almari', 'almari banane wala', 'wardrobe banane wala',
      'kapdo ki almari banane wala', 'almari ka kaam', 'wardrobe designer',
      'wardrobe maker', 'custom wardrobe', 'wardrobe near me', 'wardrobe charkhi dadri',
      'cupboard maker', 'wardrobe maker charkhi dadri'
    ]
  },
  {
    targetKeywords: ['tv unit', 'tv panel design', 'tv panel'],
    aliases: [
      'tv cabinet', 'tv panel', 'entertainment unit', 'tv stand', 'tv console', 'wall unit',
      'media unit', 'entertainment console', 'tv wall panel', 'designer tv unit',
      'modular tv unit', 'wooden tv unit', 'led panel', 'led unit', 'wall mounted tv unit',
      'modern tv unit', 'luxury tv unit', 'tv unitt', 'tv panal', 'tv cabnit', 'tv standd',
      'led panal', 'tv wall', 'tv setup', 'tv panel banane wala', 'tv unit banane wala',
      'led panel banane wala', 'tv panel ka kaam', 'tv wall ka kaam', 'tv wall design',
      'tv unit designer', 'tv panel contractor', 'tv unit near me',
      'tv unit designer charkhi dadri'
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
      'bedd', 'beed', 'wooden bedd', 'double bedd', 'bed set', 'palang', 'khat', 'beddroom bed',
      'bed banane wala', 'palang banane wala', 'lakdi ka bed', 'lakdi ka palang',
      'bed ka kaam', 'double bed banane wala', 'bed manufacturer', 'bed maker', 'bed near me'
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
      'civil work', 'ghar ka kaam', 'ghar banane wala', 'ghar banwane wala',
      'makan banane wala', 'makaan banane wala', 'house banane wala',
      'ghar ka thekedar', 'makan ka thekedar', 'construction wala', 'raj mistri ka kaam',
      'civil ka kaam karne wala', 'house construction contractor', 'home builder',
      'civil contractor', 'building contractor', 'construction company charkhi dadri',
      'house builder charkhi dadri', 'construction near me', 'turnkey contractor',
      'construction company', 'home construction near me', 'residential construction',
      'commercial construction', 'budget home construction', 'luxury home construction',
      'construction services haryana', 'contractor charkhi dadri', 'civil contractor charkhi dadri',
      'home renovation contractor', 'house renovation services'
    ]
  },
  {
    targetKeywords: ['interior design', 'interior', 'modular interior', 'living room interior', 'bedroom interior'],
    aliases: [
      'interior designer', 'interior decorator', 'home interior', 'office interior',
      'luxury interior', 'modern interior', 'interior designer charkhi dadri',
      'interior contractor', 'interior company', 'interior renovation',
      'house interior designer', 'interior near me', 'best interior designer',
      'living room interior', 'bedroom interior'
    ]
  },
  {
    targetKeywords: ['electrical work', 'electrical'],
    aliases: [
      'electric work', 'electrical services', 'electrical installation', 'wiring work',
      'house wiring', 'commercial wiring', 'industrial electrical work', 'power solutions',
      'electrical maintenance', 'electric fitting', 'switch board work', 'lighting work',
      'cctv electrical work', 'smart electrical solutions', 'electical work', 'bijli ka kaam',
      'wiring fitting', 'light fitting', 'board fitting', 'electric ka kaam',
      'bijli ka kaam karne wala', 'electric ka kaam karne wala', 'wiring karne wala',
      'light fitting karne wala', 'electrician charkhi dadri'
    ]
  },
  {
    targetKeywords: ['paint work', 'paint'],
    aliases: [
      'painting work', 'wall painting', 'interior painting', 'exterior painting', 'texture paint',
      'wall finish', 'decorative paint', 'home painting', 'building painting', 'spray painting',
      'designer paint work', 'waterproof paint work', 'putty paint work', 'color coating',
      'premium paint finish', 'painting ka kaam', 'rang rogan', 'color work', 'wall color',
      'paintig work', 'painter work', 'paint ka kaam', 'paint karne wala',
      'painter charkhi dadri', 'rang karne wala', 'wall paint karne wala'
    ]
  },
  {
    targetKeywords: ['plumbing', 'plumbing work'],
    aliases: [
      'plumbing services', 'pipe fitting', 'water pipeline work', 'sanitary work',
      'bathroom fitting', 'water connection work', 'drainage work', 'pipe installation',
      'water system setup', 'bathroom plumbing', 'kitchen plumbing', 'plumbing maintenance',
      'plumbing solutions', 'plumber work', 'paani ki line ka kaam', 'nal ka kaam', 'pipe work',
      'plumber charkhi dadri'
    ]
  },
  {
    targetKeywords: ['tiles work', 'marble work', 'tiles', 'marble'],
    aliases: [
      'tile installation', 'marble installation', 'flooring work', 'granite work', 'stone work',
      'floor tile work', 'wall tile work', 'italian marble work', 'designer flooring',
      'tile fitting', 'marble fitting', 'luxury flooring', 'wall cladding work', 'stone flooring',
      'farsh ka kaam', 'pathar work', 'tailes work', 'marbal work', 'flooring ka kaam',
      'tiles lagane wala', 'marble lagane wala', 'farsh lagane wala',
      'tiles ka kaam karne wala', 'marble ka kaam karne wala', 'tile contractor',
      'marble contractor', 'flooring contractor', 'tiles near me',
      'marble work charkhi dadri', 'flooring specialist', 'tiles contractor charkhi dadri'
    ]
  },
  {
    targetKeywords: ['sofa', 'sofa set'],
    aliases: [
      'sofa banane wala', 'sofa set banane wala', 'sofa maker', 'custom sofa',
      'designer sofa', 'wooden sofa', 'sofa ka kaam', 'sofa repair', 'sofa design',
      'sofa set ka kaam karne wala'
    ]
  },
  {
    targetKeywords: ['furniture', 'customized furniture', 'office furniture'],
    aliases: [
      'furniture banane wala', 'furniture wala', 'lakdi ka furniture',
      'custom furniture banane wala', 'office furniture banane wala',
      'furniture ka kaam', 'furniture ka kaam karne wala', 'carpenter',
      'carpenter charkhi dadri', 'badhai', 'badhai ka kaam', 'furniture shop charkhi dadri',
      'furniture store charkhi dadri', 'custom furniture maker', 'furniture manufacturer',
      'wood furniture maker', 'furniture near me', 'best furniture shop',
      'furniture contractor', 'furniture shop', 'furniture store', 'custom furniture',
      'wooden furniture', 'office furniture', 'home furniture', 'furniture manufacturer charkhi dadri',
      'carpenter furniture work', 'custom furniture charkhi dadri', 'best carpenter in charkhi dadri',
      'wooden work contractor'
    ]
  },
  {
    targetKeywords: ['false ceiling', 'pop design', 'pop'],
    aliases: [
      'pop ka kaam', 'pop ka kaam karne wala', 'pop design wala',
      'pop banane wala', 'ceiling ka kaam', 'false ceiling ka kaam',
      'false ceiling banane wala', 'chhat ka pop', 'pop ceiling design',
      'pop mistri', 'false ceiling contractor', 'gypsum ceiling', 'ceiling design',
      'false ceiling near me', 'pop contractor', 'ceiling work charkhi dadri',
      'false ceiling contractor charkhi dadri'
    ]
  },
  {
    targetKeywords: ['wall panels', 'pvc panels', 'wall panel'],
    aliases: [
      'wall panel ka kaam', 'pvc panel ka kaam', 'pvc lagane wala',
      'wall panel lagane wala', 'deewar panel', 'deewar ka panel',
      'wall panel banane wala'
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
