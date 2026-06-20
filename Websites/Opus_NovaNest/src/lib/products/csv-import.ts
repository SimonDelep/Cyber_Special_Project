import {
  validateProductCategory,
  validateProductDescription,
  validateProductImage,
  validateProductName,
  validateProductSlug,
  validatePriceCents,
} from '../auth/product-validation';
import { createProduct, findProductBySlug } from '../db/products';
import type { Product } from '../db/schema';
import { CSV_HEADERS } from './csv-import-constants';

export { CSV_HEADERS } from './csv-import-constants';

export type CsvImportRowResult =
  | { ok: true; row: number; product: Product }
  | { ok: false; row: number; message: string };

export type CsvImportSummary = {
  created: number;
  skipped: number;
  failed: number;
  results: CsvImportRowResult[];
};

const MAX_ROWS = 500;
const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

/** Parse CSV text into rows (handles quoted fields with commas and newlines). */
export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || (char === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      if (char === '\r') i++;
    } else if (char !== '\r') {
      field += char;
    }
  }

  row.push(field);
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseFeatured(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'y';
}

function parsePriceCents(row: Record<string, string>): number | null {
  const centsRaw = row.price_cents?.trim() ?? '';
  if (centsRaw) {
    const cents = Number.parseInt(centsRaw, 10);
    if (Number.isInteger(cents)) return cents;
  }

  const dollarsRaw = row.price?.trim() ?? row.price_dollars?.trim() ?? '';
  if (dollarsRaw) {
    const dollars = Number.parseFloat(dollarsRaw);
    if (!Number.isNaN(dollars)) return Math.round(dollars * 100);
  }

  return null;
}

function validateProductRow(
  row: Record<string, string>,
  rowNumber: number,
): { ok: true; data: Parameters<typeof createProduct>[0] } | { ok: false; message: string } {
  const name = row.name ?? '';
  const slug = (row.slug ?? '').trim().toLowerCase();
  const description = row.description ?? '';
  const category = row.category ?? '';
  const image = row.image ?? '';
  const priceCents = parsePriceCents(row);
  const featured = parseFeatured(row.featured ?? '');

  if (priceCents === null) {
    return {
      ok: false,
      message: 'price_cents must be a whole number (or use price for dollars, e.g. 79.99).',
    };
  }

  const errors = [
    validateProductName(name),
    validateProductSlug(slug),
    validateProductDescription(description),
    validatePriceCents(priceCents),
    validateProductCategory(category),
    validateProductImage(image),
  ].filter(Boolean);

  if (errors.length > 0) {
    return { ok: false, message: errors[0]! };
  }

  if (findProductBySlug(slug)) {
    return { ok: false, message: `Slug "${slug}" already exists (skipped).` };
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description,
      priceCents,
      category,
      image,
      featured,
    },
  };
}

export function importProductsFromCsv(csvText: string): CsvImportSummary {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return { created: 0, skipped: 0, failed: 1, results: [{ ok: false, row: 0, message: 'CSV file is empty.' }] };
  }

  const headerRow = rows[0]!.map(normalizeHeader);
  const missing = CSV_HEADERS.filter((h) => !headerRow.includes(h));
  if (missing.length > 0) {
    return {
      created: 0,
      skipped: 0,
      failed: 1,
      results: [
        {
          ok: false,
          row: 1,
          message: `Missing required column(s): ${missing.join(', ')}. Expected: ${CSV_HEADERS.join(', ')}.`,
        },
      ],
    };
  }

  const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (dataRows.length === 0) {
    return { created: 0, skipped: 0, failed: 1, results: [{ ok: false, row: 1, message: 'No product rows found.' }] };
  }

  if (dataRows.length > MAX_ROWS) {
    return {
      created: 0,
      skipped: 0,
      failed: 1,
      results: [{ ok: false, row: 0, message: `Maximum ${MAX_ROWS} products per import.` }],
    };
  }

  const results: CsvImportRowResult[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2;
    const cells = dataRows[i]!;
    const record: Record<string, string> = {};
    for (let c = 0; c < headerRow.length; c++) {
      record[headerRow[c]!] = cells[c] ?? '';
    }

    const validated = validateProductRow(record, rowNumber);
    if (!validated.ok) {
      const isSkip = validated.message.includes('already exists');
      if (isSkip) {
        skipped++;
        results.push({ ok: false, row: rowNumber, message: validated.message });
      } else {
        failed++;
        results.push({ ok: false, row: rowNumber, message: validated.message });
      }
      continue;
    }

    try {
      const product = createProduct(validated.data);
      created++;
      results.push({ ok: true, row: rowNumber, product });
    } catch (err) {
      failed++;
      results.push({
        ok: false,
        row: rowNumber,
        message: err instanceof Error ? err.message : 'Failed to create product.',
      });
    }
  }

  return { created, skipped, failed, results };
}

export function assertCsvFileSize(byteLength: number): string | null {
  if (byteLength > MAX_FILE_BYTES) {
    return 'CSV file must be 1 MB or smaller.';
  }
  return null;
}
