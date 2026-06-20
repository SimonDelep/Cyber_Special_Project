import {
  createProduct,
  listCategoriesForSelect,
  parsePriceToCents,
  validateProductSlug,
} from "@/lib/admin/products";

export const CSV_COLUMNS = [
  "slug",
  "name",
  "description",
  "price",
  "stock",
  "category_slug",
  "image_url",
  "featured",
] as const;

export const REQUIRED_CSV_COLUMNS = ["slug", "name", "price", "stock"] as const;

export type CsvProductRow = {
  rowNumber: number;
  slug: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  categorySlug: string;
  imageUrl: string;
  featured: string;
};

export type ImportRowResult = {
  rowNumber: number;
  slug: string;
  ok: boolean;
  error?: string;
  productId?: number;
};

export type ImportCsvResult = {
  created: number;
  failed: number;
  skippedEmpty: number;
  results: ImportRowResult[];
  parseError?: string;
};

/** Parse CSV text into rows (handles quoted fields with commas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

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
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBooleanCell(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n", ""].includes(v)) return false;
  throw new Error(`Invalid featured value "${value}" (use true/false).`);
}

function mapRowsToProducts(
  rows: string[][],
): { rows: CsvProductRow[]; error?: string } {
  if (rows.length === 0) {
    return { rows: [], error: "The CSV file is empty." };
  }

  const header = rows[0].map(normalizeHeader);
  const missing = REQUIRED_CSV_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return {
      rows: [],
      error: `Missing required column(s): ${missing.join(", ")}. Expected header: ${CSV_COLUMNS.join(", ")}`,
    };
  }

  const index = Object.fromEntries(header.map((name, i) => [name, i]));

  const get = (cells: string[], col: string) => {
    const idx = index[col];
    return idx === undefined ? "" : (cells[idx] ?? "").trim();
  };

  const dataRows: CsvProductRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const slug = get(cells, "slug");
    const name = get(cells, "name");
    if (!slug && !name && cells.every((c) => !c.trim())) continue;

    dataRows.push({
      rowNumber: i + 1,
      slug,
      name,
      description: get(cells, "description"),
      price: get(cells, "price"),
      stock: get(cells, "stock"),
      categorySlug: get(cells, "category_slug"),
      imageUrl: get(cells, "image_url"),
      featured: get(cells, "featured"),
    });
  }

  return { rows: dataRows };
}

export function importProductsFromCsv(csvText: string): ImportCsvResult {
  const parsed = parseCsv(csvText);
  const { rows, error: mapError } = mapRowsToProducts(parsed);

  if (mapError) {
    return { created: 0, failed: 0, skippedEmpty: 0, results: [], parseError: mapError };
  }

  if (rows.length === 0) {
    return {
      created: 0,
      failed: 0,
      skippedEmpty: 0,
      results: [],
      parseError: "No product rows found below the header.",
    };
  }

  const categories = listCategoriesForSelect();
  const categoryBySlug = Object.fromEntries(
    categories.map((c) => [c.slug.toLowerCase(), c.id]),
  );

  const results: ImportRowResult[] = [];
  let created = 0;
  let failed = 0;

  for (const row of rows) {
    const slug = row.slug.trim().toLowerCase();
    const slugError = validateProductSlug(slug);
    if (slugError) {
      results.push({ rowNumber: row.rowNumber, slug, ok: false, error: slugError });
      failed++;
      continue;
    }

    if (!row.name.trim()) {
      results.push({
        rowNumber: row.rowNumber,
        slug,
        ok: false,
        error: "Name is required.",
      });
      failed++;
      continue;
    }

    const price = parsePriceToCents(row.price);
    if (price.error) {
      results.push({
        rowNumber: row.rowNumber,
        slug,
        ok: false,
        error: price.error,
      });
      failed++;
      continue;
    }

    const stock = Number(row.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      results.push({
        rowNumber: row.rowNumber,
        slug,
        ok: false,
        error: "Stock must be a non-negative integer.",
      });
      failed++;
      continue;
    }

    let categoryId: number | null = null;
    if (row.categorySlug.trim()) {
      const key = row.categorySlug.trim().toLowerCase();
      const id = categoryBySlug[key];
      if (!id) {
        results.push({
          rowNumber: row.rowNumber,
          slug,
          ok: false,
          error: `Unknown category_slug "${row.categorySlug}".`,
        });
        failed++;
        continue;
      }
      categoryId = id;
    }

    let featured = false;
    try {
      featured = parseBooleanCell(row.featured);
    } catch (err) {
      results.push({
        rowNumber: row.rowNumber,
        slug,
        ok: false,
        error: err instanceof Error ? err.message : "Invalid featured value.",
      });
      failed++;
      continue;
    }

    const result = createProduct({
      slug,
      name: row.name,
      description: row.description || undefined,
      priceCents: price.cents!,
      stock,
      categoryId,
      imageUrl: row.imageUrl || null,
      featured,
    });

    if (result.error || !result.product) {
      results.push({
        rowNumber: row.rowNumber,
        slug,
        ok: false,
        error: result.error ?? "Could not create product.",
      });
      failed++;
      continue;
    }

    results.push({
      rowNumber: row.rowNumber,
      slug,
      ok: true,
      productId: result.product.id,
    });
    created++;
  }

  return { created, failed, skippedEmpty: 0, results };
}
