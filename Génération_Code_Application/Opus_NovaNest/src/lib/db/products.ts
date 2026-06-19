import { getSqlite } from './client';
import type { Product } from './schema';

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  category: string;
  image: string;
  featured: number;
};

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    priceCents: row.price_cents,
    category: row.category,
    image: row.image,
    featured: Boolean(row.featured),
  };
}

const SELECT_COLUMNS = `
  id, name, slug, description, price_cents, category, image, featured
`;

export function getAllProducts(): Product[] {
  const db = getSqlite();
  const rows = db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM products ORDER BY id`)
    .all() as ProductRow[];
  return rows.map(mapRow);
}

export function getProductById(id: number): Product | null {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM products WHERE id = ?`)
    .get(id) as ProductRow | undefined;
  return row ? mapRow(row) : null;
}

export function findProductBySlug(slug: string): Product | null {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM products WHERE slug = ?`)
    .get(slug.trim().toLowerCase()) as ProductRow | undefined;
  return row ? mapRow(row) : null;
}

export function getProductsByCategory(category: string): Product[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM products WHERE category = ? ORDER BY id`,
    )
    .all(category) as ProductRow[];
  return rows.map(mapRow);
}

export function getFeaturedProducts(): Product[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM products WHERE featured = 1 ORDER BY id`,
    )
    .all() as ProductRow[];
  return rows.map(mapRow);
}

export function countProducts(): number {
  const db = getSqlite();
  const row = db.prepare('SELECT COUNT(*) AS count FROM products').get() as {
    count: number;
  };
  return row.count;
}

export function insertProducts(
  items: Array<{
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    category: string;
    image: string;
    featured: boolean;
  }>,
): void {
  const db = getSqlite();
  const stmt = db.prepare(`
    INSERT INTO products (name, slug, description, price_cents, category, image, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    stmt.run(
      item.name,
      item.slug,
      item.description,
      item.priceCents,
      item.category,
      item.image,
      item.featured ? 1 : 0,
    );
  }
}

export function createProduct(input: {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  category: string;
  image: string;
  featured: boolean;
}): Product {
  const db = getSqlite();
  const result = db
    .prepare(
      `INSERT INTO products (name, slug, description, price_cents, category, image, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name.trim(),
      input.slug.trim().toLowerCase(),
      input.description.trim(),
      input.priceCents,
      input.category.trim(),
      input.image.trim(),
      input.featured ? 1 : 0,
    );

  const created = getProductById(Number(result.lastInsertRowid));
  if (!created) throw new Error('Failed to create product');
  return created;
}

export function updateProduct(
  id: number,
  fields: Partial<{
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    category: string;
    image: string;
    featured: boolean;
  }>,
): Product | null {
  const existing = getProductById(id);
  if (!existing) return null;

  const db = getSqlite();
  db.prepare(
    `UPDATE products SET
      name = ?,
      slug = ?,
      description = ?,
      price_cents = ?,
      category = ?,
      image = ?,
      featured = ?
     WHERE id = ?`,
  ).run(
    fields.name?.trim() ?? existing.name,
    fields.slug?.trim().toLowerCase() ?? existing.slug,
    fields.description?.trim() ?? existing.description,
    fields.priceCents ?? existing.priceCents,
    fields.category?.trim() ?? existing.category,
    fields.image?.trim() ?? existing.image,
    fields.featured !== undefined ? (fields.featured ? 1 : 0) : existing.featured ? 1 : 0,
    id,
  );

  return getProductById(id);
}

export function deleteProduct(id: number): boolean {
  const db = getSqlite();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

export type ProductSort =
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

export type ProductSearchFilters = {
  q?: string;
  category?: string;
  featured?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: ProductSort;
};

export function searchProducts(filters: ProductSearchFilters = {}): Product[] {
  const db = getSqlite();
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  const q = filters.q?.trim();
  if (q) {
    conditions.push(
      `(name LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR slug LIKE ? COLLATE NOCASE)`,
    );
    const pattern = `%${q}%`;
    params.push(pattern, pattern, pattern);
  }

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (filters.featured === true) {
    conditions.push('featured = 1');
  }

  if (filters.minPriceCents !== undefined) {
    conditions.push('price_cents >= ?');
    params.push(filters.minPriceCents);
  }

  if (filters.maxPriceCents !== undefined) {
    conditions.push('price_cents <= ?');
    params.push(filters.maxPriceCents);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'id ASC';
  switch (filters.sort) {
    case 'name-asc':
      orderBy = 'name COLLATE NOCASE ASC';
      break;
    case 'name-desc':
      orderBy = 'name COLLATE NOCASE DESC';
      break;
    case 'price-asc':
      orderBy = 'price_cents ASC';
      break;
    case 'price-desc':
      orderBy = 'price_cents DESC';
      break;
    case 'newest':
      orderBy = 'id DESC';
      break;
    default:
      break;
  }

  const rows = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM products ${where} ORDER BY ${orderBy}`,
    )
    .all(...params) as ProductRow[];

  return rows.map(mapRow);
}
