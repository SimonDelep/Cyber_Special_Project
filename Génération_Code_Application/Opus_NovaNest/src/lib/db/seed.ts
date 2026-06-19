import {
  countProducts,
  findProductBySlug,
  insertProducts,
} from './products';
import { seedDefaultAdmin } from './seed-users';

/** Canonical catalog — at least five products for the storefront. */
export const seedProducts = [
  {
    name: 'NovaRing Pro',
    slug: 'novaring-pro',
    description:
      '1080p HDR video doorbell with two-way audio, motion zones, and full app control from iOS or Android.',
    priceCents: 24999,
    category: 'doorbell-cameras',
    image: '/images/products/novaring-pro.svg',
    featured: true,
  },
  {
    name: 'NovaRing Lite',
    slug: 'novaring-lite',
    description:
      'Compact smart doorbell camera with night vision and instant push alerts — perfect for apartments.',
    priceCents: 14999,
    category: 'doorbell-cameras',
    image: '/images/products/novaring-lite.svg',
    featured: true,
  },
  {
    name: 'AuraStrip RGB',
    slug: 'aurastrip-rgb',
    description:
      '16 million colors, music sync, and scene presets. Ambient LED strip controllable from the NovaNest app.',
    priceCents: 7999,
    category: 'smart-lighting',
    image: '/images/products/aurastrip-rgb.svg',
    featured: true,
  },
  {
    name: 'AuraPanel Ceiling',
    slug: 'aurapanel-ceiling',
    description:
      'Flush-mount smart ceiling panel with warm-to-cool white tuning and circadian scheduling.',
    priceCents: 12999,
    category: 'smart-lighting',
    image: '/images/products/aurapanel-ceiling.svg',
    featured: true,
  },
  {
    name: 'AuraBulb E26',
    slug: 'aurabulb-e26',
    description:
      'Smart bulb with dimming, color scenes, and voice-assistant compatibility. Screw-in, no hub required.',
    priceCents: 3499,
    category: 'smart-lighting',
    image: '/images/products/aurabulb-e26.svg',
    featured: true,
  },
];

function ensureCatalogProducts(): void {
  const missing = seedProducts.filter((p) => !findProductBySlug(p.slug));
  if (missing.length === 0) return;
  insertProducts(missing);
  console.log(`Added ${missing.length} missing catalog product(s).`);
}

async function run() {
  if (countProducts() === 0) {
    insertProducts(seedProducts);
    console.log(`Seeded ${seedProducts.length} products.`);
  } else {
    ensureCatalogProducts();
    const total = countProducts();
    if (total < seedProducts.length) {
      console.warn(
        `Catalog has ${total} product(s); expected at least ${seedProducts.length}.`,
      );
    } else {
      console.log(`Catalog OK (${total} products).`);
    }
  }
  await seedDefaultAdmin();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
