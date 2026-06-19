export const seedCategories = [
  {
    id: 'cat-air',
    name: 'Air Purifiers',
    slug: 'air-purifiers',
    description: 'Ultra-quiet portable units for bedrooms, offices, and travel.',
  },
  {
    id: 'cat-humid',
    name: 'Humidifiers',
    slug: 'humidifiers',
    description: 'Desktop humidifiers with precise mist control and night mode.',
  },
  {
    id: 'cat-bottle',
    name: 'Smart Bottles',
    slug: 'smart-bottles',
    description: 'Hydration trackers with built-in UV sterilization.',
  },
] as const;

export const seedProducts = [
  {
    id: 'prod-whisper-pure',
    categoryId: 'cat-air',
    name: 'WhisperPure Mini',
    slug: 'whisperpure-mini',
    description:
      'HEPA-13 filtration in a palm-sized shell. Under 18 dB on sleep mode.',
    price: 149.99,
    image: '/images/whisperpure-mini.svg',
    badge: 'Best seller',
    featured: true,
  },
  {
    id: 'prod-volt-breeze',
    categoryId: 'cat-air',
    name: 'VoltBreeze Pro',
    slug: 'voltbreeze-pro',
    description:
      'Dual-stage carbon + HEPA for larger rooms. USB-C powered for travel.',
    price: 229.99,
    image: '/images/voltbreeze-pro.svg',
    badge: 'New',
    featured: true,
  },
  {
    id: 'prod-mist-desk',
    categoryId: 'cat-humid',
    name: 'MistDesk One',
    slug: 'mistdesk-one',
    description:
      'Ultrasonic desktop humidifier with auto humidity targeting and silent LEDs.',
    price: 89.99,
    image: '/images/mistdesk-one.svg',
    badge: null,
    featured: true,
  },
  {
    id: 'prod-cloud-pulse',
    categoryId: 'cat-humid',
    name: 'CloudPulse',
    slug: 'cloudpulse',
    description:
      'Warm and cool mist modes with antimicrobial tank coating.',
    price: 119.99,
    image: '/images/cloudpulse.svg',
    badge: 'Desk favorite',
    featured: true,
  },
  {
    id: 'prod-uv-hydro',
    categoryId: 'cat-bottle',
    name: 'UV Hydro Flask+',
    slug: 'uv-hydro-flask-plus',
    description:
      'Smart water bottle with UV-C cap sterilization and hydration reminders.',
    price: 79.99,
    image: '/images/uv-hydro-flask.svg',
    badge: 'UV sterilization',
    featured: true,
  },
  {
    id: 'prod-stream-cap',
    categoryId: 'cat-bottle',
    name: 'StreamCap Elite',
    slug: 'streamcap-elite',
    description:
      'Insulated steel body, app sync, and 60-second UV cycle after each refill.',
    price: 99.99,
    image: '/images/streamcap-elite.svg',
    badge: 'Premium',
    featured: true,
  },
  {
    id: 'prod-pureair-desk',
    categoryId: 'cat-air',
    name: 'PureAir Desk',
    slug: 'pureair-desk',
    description:
      'Compact HEPA desk purifier with whisper mode — ideal for home offices and study nooks.',
    price: 129.99,
    image: '/images/pureair-desk.svg',
    badge: null,
    featured: true,
  },
] as const;
