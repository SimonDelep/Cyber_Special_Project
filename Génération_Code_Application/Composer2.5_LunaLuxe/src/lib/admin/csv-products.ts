import { productCategories, type ProductCategory } from '@/db/schema';
import { createProduct, isValidCategory, slugify } from '@/lib/admin/products';
import { getProductBySlug } from '@/lib/products';

export const CSV_HEADERS = [
  'name',
  'description',
  'price',
  'category',
  'image_url',
  'slug',
  'featured',
] as const;

const HEADER_ALIASES: Record<string, keyof ParsedCsvRow> = {
  name: 'name',
  description: 'description',
  price: 'price',
  category: 'category',
  image_url: 'imageUrl',
  imageurl: 'imageUrl',
  slug: 'slug',
  featured: 'featured',
};

interface ParsedCsvRow {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  slug: string;
  featured: string;
}

export interface ValidatedProductRow {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  slug: string;
  featured: boolean;
}

export interface CsvImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  const pushRow = () => {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) {
      rows.push(row);
    }
    row = [];
    field = '';
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (char === '\r') {
      i++;
      continue;
    }
    if (char === '\n') {
      pushRow();
      i++;
      continue;
    }

    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows;
}

function parseFeatured(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  return v === '1' || v === 'true' || v === 'yes' || v === 'y';
}

function mapRow(headers: string[], values: string[]): Partial<ParsedCsvRow> {
  const mapped: Partial<ParsedCsvRow> = {};

  headers.forEach((header, index) => {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (!key) return;
    mapped[key] = (values[index] ?? '').trim();
  });

  return mapped;
}

function validateRow(
  row: Partial<ParsedCsvRow>,
  lineNumber: number
): { ok: true; data: ValidatedProductRow } | { ok: false; error: string } {
  const name = row.name?.trim() ?? '';
  const description = row.description?.trim() ?? '';
  const price = Number(row.price);
  const category = row.category?.trim() ?? '';
  const imageUrl = row.imageUrl?.trim() ?? '';
  let slug = row.slug?.trim() ?? '';

  if (!name) {
    return { ok: false, error: `Row ${lineNumber}: name is required.` };
  }
  if (!description) {
    return { ok: false, error: `Row ${lineNumber}: description is required.` };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: `Row ${lineNumber}: invalid price "${row.price}".` };
  }
  if (!isValidCategory(category)) {
    return {
      ok: false,
      error: `Row ${lineNumber}: invalid category "${category}". Use: ${productCategories.join(', ')}.`,
    };
  }
  if (!imageUrl) {
    return { ok: false, error: `Row ${lineNumber}: image_url is required.` };
  }

  if (!slug) slug = slugify(name);
  if (!slug) {
    return { ok: false, error: `Row ${lineNumber}: could not derive a valid slug.` };
  }

  return {
    ok: true,
    data: {
      name,
      description,
      price: Math.round(price * 100) / 100,
      category,
      imageUrl,
      slug,
      featured: parseFeatured(row.featured ?? ''),
    },
  };
}

export function parseProductCsv(csvText: string): {
  rows: ValidatedProductRow[];
  errors: string[];
} {
  const table = parseCsv(csvText.trim());
  if (table.length === 0) {
    return { rows: [], errors: ['CSV file is empty.'] };
  }

  const [headerRow, ...dataRows] = table;
  const headers = headerRow.map(normalizeHeader);

  const required = ['name', 'description', 'price', 'category', 'image_url'];
  const missing = required.filter((h) => !headers.includes(h) && !(h === 'image_url' && headers.includes('imageurl')));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(', ')}. Expected: ${CSV_HEADERS.join(', ')}.`],
    };
  }

  const rows: ValidatedProductRow[] = [];
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  dataRows.forEach((values, index) => {
    const lineNumber = index + 2;
    const mapped = mapRow(headerRow, values);
    const result = validateRow(mapped, lineNumber);

    if (!result.ok) {
      errors.push(result.error);
      return;
    }

    if (seenSlugs.has(result.data.slug)) {
      errors.push(`Row ${lineNumber}: duplicate slug "${result.data.slug}" in CSV.`);
      return;
    }
    seenSlugs.add(result.data.slug);

    rows.push(result.data);
  });

  if (dataRows.length === 0) {
    errors.push('CSV has headers but no product rows.');
  }

  return { rows, errors };
}

export async function importProductsFromCsv(csvText: string): Promise<CsvImportResult> {
  const { rows, errors } = parseProductCsv(csvText);

  if (errors.length > 0) {
    return { created: 0, skipped: 0, errors };
  }

  let created = 0;
  let skipped = 0;
  const importErrors: string[] = [];

  for (const row of rows) {
    const existing = await getProductBySlug(row.slug);
    if (existing) {
      skipped++;
      importErrors.push(`Skipped "${row.name}": slug "${row.slug}" already exists.`);
      continue;
    }

    try {
      await createProduct(row);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      importErrors.push(`Failed to import "${row.name}": ${msg}`);
    }
  }

  if (created === 0 && skipped === 0 && importErrors.length === 0) {
    return { created: 0, skipped: 0, errors: ['No products to import.'] };
  }

  return { created, skipped, errors: importErrors };
}
