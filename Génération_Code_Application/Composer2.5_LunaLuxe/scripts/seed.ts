import { db } from '../src/db/index';
import { products, users } from '../src/db/schema';
import { count, eq } from 'drizzle-orm';
import { createUser } from '../src/lib/auth/users';

const seedProducts = [
  {
    slug: 'silk-sleep-mask-midnight',
    name: 'Midnight Silk Sleep Mask',
    description:
      'Hand-finished mulberry silk mask with an adjustable strap and light-blocking contour for uninterrupted REM sleep.',
    price: 68,
    category: 'Silk Sleep Masks',
    imageUrl: 'https://images.unsplash.com/photo-1616628188854-7840f4c4a76a?w=600&h=450&fit=crop',
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    slug: 'bamboo-sheet-set-cloud',
    name: 'Cloud Bamboo Sheet Set',
    description:
      '400-thread-count bamboo lyocell sheets with natural thermoregulation — cool, silky, and sustainably sourced.',
    price: 189,
    category: 'Bamboo Bed Sheets',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=450&fit=crop',
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    slug: 'lavender-weighted-blanket-dream',
    name: 'Dream Lavender Weighted Blanket',
    description:
      '12 lb blanket with lavender-infused glass beads and organic cotton cover for deep pressure calm and aromatherapy.',
    price: 249,
    category: 'Weighted Blankets',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=450&fit=crop',
    featured: true,
    createdAt: new Date().toISOString(),
  },
];

async function seedProductsData() {
  const [result] = await db.select({ value: count() }).from(products);
  if (result.value > 0) {
    console.log('Products already seeded, skipping.');
    return;
  }
  await db.insert(products).values(seedProducts);
  console.log(`Seeded ${seedProducts.length} products.`);
}

async function seedAdminUser() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, 'admin'))
    .limit(1);

  if (existing) {
    console.log('Admin user already exists, skipping.');
    return;
  }

  await createUser({
    username: 'admin',
    email: 'admin@lunaluxe.com',
    password: 'Admin123!',
    displayName: 'Administrator',
    role: 'admin',
  });
  console.log('Seeded admin user (username: admin, password: Admin123!)');
}

async function seed() {
  await seedProductsData();
  await seedAdminUser();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
