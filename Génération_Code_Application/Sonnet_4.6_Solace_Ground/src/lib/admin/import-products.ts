import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { products } from '@/db/schema';
import { validateProductInput } from '@/lib/admin/validation';
import { parseCsv, rowsToRecords } from '@/lib/admin/csv';
import { dollarsToCents } from '@/lib/utils';
import type { Product } from '@/db/schema';

export type ImportRowError = {
  row: number;
  slug: string;
  message: string;
};

export type ProductImportResult = {
  created: number;
  failed: number;
  errors: ImportRowError[];
  products: Product[];
};

function parseInStock(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const v = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'in stock', 'instock'].includes(v)) return true;
  if (['false', '0', 'no', 'n', 'out', 'out of stock'].includes(v)) return false;
  return true;
}

function parsePriceCents(record: Record<string, string>): number | null {
  const centsRaw = record.price_cents?.trim();
  if (centsRaw) {
    const cents = Number.parseInt(centsRaw, 10);
    return Number.isInteger(cents) && cents >= 0 ? cents : null;
  }

  const usdRaw = record.price_usd?.trim();
  if (usdRaw) {
    const cents = dollarsToCents(usdRaw);
    return Number.isNaN(cents) || cents < 0 ? null : cents;
  }

  return null;
}

export function importProductsFromCsv(csvText: string): ProductImportResult {
  const rows = parseCsv(csvText);
  const parsed = rowsToRecords(rows);

  if ('error' in parsed) {
    return {
      created: 0,
      failed: 0,
      errors: [{ row: 0, slug: '', message: parsed.error }],
      products: [],
    };
  }

  const db = getDb();
  const seenSlugs = new Set<string>();
  const errors: ImportRowError[] = [];
  const createdProducts: Product[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < parsed.records.length; i++) {
    const rowNumber = i + 2;
    const record = parsed.records[i];
    const slug = record.slug?.trim().toLowerCase() ?? '';

    if (!slug) {
      errors.push({ row: rowNumber, slug: '', message: 'Slug is required.' });
      continue;
    }

    if (seenSlugs.has(slug)) {
      errors.push({
        row: rowNumber,
        slug,
        message: 'Duplicate slug in this CSV file.',
      });
      continue;
    }
    seenSlugs.add(slug);

    const priceCents = parsePriceCents(record);
    if (priceCents === null) {
      errors.push({
        row: rowNumber,
        slug,
        message: 'Invalid price. Use price_usd (e.g. 89.00) or price_cents (e.g. 8900).',
      });
      continue;
    }

    const imageUrl = record.image_url?.trim() || null;
    const inStock = parseInStock(record.in_stock);

    const fieldErrors = validateProductInput({
      slug,
      name: record.name,
      description: record.description,
      category: record.category,
      priceCents,
      imageUrl,
      inStock,
    });

    if (Object.keys(fieldErrors).length > 0) {
      errors.push({
        row: rowNumber,
        slug,
        message: Object.values(fieldErrors).join(' '),
      });
      continue;
    }

    const existing = db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .get();

    if (existing) {
      errors.push({
        row: rowNumber,
        slug,
        message: 'A product with this slug already exists in the catalog.',
      });
      continue;
    }

    try {
      const inserted = db
        .insert(products)
        .values({
          slug,
          name: record.name.trim(),
          description: record.description.trim(),
          category: record.category.trim(),
          priceCents,
          imageUrl,
          inStock,
          createdAt: now,
        })
        .returning()
        .get();
      createdProducts.push(inserted);
    } catch {
      errors.push({
        row: rowNumber,
        slug,
        message: 'Could not insert product (database error).',
      });
    }
  }

  return {
    created: createdProducts.length,
    failed: errors.length,
    errors,
    products: createdProducts,
  };
}
