import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { categories } from '@/db/schema';
import { createProduct, type ProductInput } from '@/lib/admin/products';
import { normalizeHeader, parseCsv } from '@/lib/admin/csv-parse';
import type { ProductDTO } from '@/lib/types';

const REQUIRED_HEADERS = ['name', 'description', 'price', 'image'] as const;
const CATEGORY_HEADERS = ['category_id', 'category_slug'] as const;

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type CsvImportResult = {
  created: number;
  failed: number;
  products: ProductDTO[];
  errors: CsvImportRowError[];
};

function parseFeatured(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function isCommentRow(cells: string[]): boolean {
  const first = cells[0]?.trim() ?? '';
  return first.startsWith('#');
}

async function resolveCategoryId(
  categoryId: string | undefined,
  categorySlug: string | undefined,
): Promise<string> {
  const db = getDb();

  if (categoryId?.trim()) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId.trim()))
      .limit(1);
    if (cat) return cat.id;
    throw new Error(`Unknown category_id "${categoryId.trim()}".`);
  }

  if (categorySlug?.trim()) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug.trim()))
      .limit(1);
    if (cat) return cat.id;
    throw new Error(`Unknown category_slug "${categorySlug.trim()}".`);
  }

  throw new Error('Each row needs category_id or category_slug.');
}

type ParsedCsvRow = {
  categoryId?: string;
  categorySlug?: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  image: string;
  badge: string | null;
  featured: boolean;
};

function rowToInput(cells: string[], headerIndex: Map<string, number>): ParsedCsvRow {
  const get = (key: string): string | undefined => {
    const idx = headerIndex.get(key);
    if (idx === undefined) return undefined;
    return cells[idx]?.trim();
  };

  const priceRaw = get('price');
  const price = priceRaw ? Number.parseFloat(priceRaw) : Number.NaN;

  return {
    categoryId: get('category_id'),
    categorySlug: get('category_slug'),
    name: get('name') ?? '',
    slug: get('slug'),
    description: get('description') ?? '',
    price,
    image: get('image') ?? '',
    badge: get('badge') || null,
    featured: parseFeatured(get('featured')),
  };
}

export async function importProductsFromCsv(csvText: string): Promise<CsvImportResult> {
  const matrix = parseCsv(csvText);
  const errors: CsvImportRowError[] = [];
  const products: ProductDTO[] = [];
  let created = 0;

  if (matrix.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const headerRow = matrix[0].map((h) => normalizeHeader(h));
  const headerIndex = new Map(headerRow.map((h, i) => [h, i]));

  for (const key of REQUIRED_HEADERS) {
    if (!headerIndex.has(key)) {
      throw new Error(`Missing required column: ${key}`);
    }
  }

  const hasCategory = CATEGORY_HEADERS.some((h) => headerIndex.has(h));
  if (!hasCategory) {
    throw new Error('CSV must include category_id or category_slug column.');
  }

  for (let i = 1; i < matrix.length; i++) {
    const lineNumber = i + 1;
    const cells = matrix[i];

    if (isCommentRow(cells)) continue;

    try {
      const raw = rowToInput(cells, headerIndex);

      if (!raw.name) throw new Error('name is required.');
      if (!raw.description) throw new Error('description is required.');
      if (!raw.image) throw new Error('image is required.');
      if (!Number.isFinite(raw.price) || raw.price < 0) {
        throw new Error('price must be a non-negative number.');
      }

      const categoryId = await resolveCategoryId(raw.categoryId, raw.categorySlug);

      const product = await createProduct({
        categoryId,
        name: raw.name,
        slug: raw.slug,
        description: raw.description,
        price: raw.price,
        image: raw.image,
        badge: raw.badge,
        featured: raw.featured,
      });

      products.push(product);
      created++;
    } catch (err) {
      errors.push({
        row: lineNumber,
        message: err instanceof Error ? err.message : 'Import failed for this row.',
      });
    }
  }

  return {
    created,
    failed: errors.length,
    products,
    errors,
  };
}
