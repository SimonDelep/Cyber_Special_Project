import { dollarsToCents, slugify } from "@/lib/admin/utils";

export const PRODUCT_CSV_HEADERS = [
  "name",
  "slug",
  "description",
  "price",
  "category_slug",
  "image_url",
  "featured",
  "in_stock",
] as const;

export type CsvRowError = {
  row: number;
  field?: string;
  message: string;
};

export type ParsedProductRow = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  categorySlug: string;
  imageUrl: string | null;
  featured: boolean;
  inStock: boolean;
};

const MAX_ROWS = 500;

/** Minimal RFC 4180-style CSV parser (quoted fields, commas, newlines). */
export function parseCsv(content: string): string[][] {
  const text = content.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string, defaultValue: boolean): boolean | null {
  const v = value.trim().toLowerCase();
  if (!v) return defaultValue;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return null;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseProductCsv(
  content: string,
  existingCategorySlugs: Set<string>,
  existingProductSlugs: Set<string>,
): { rows: ParsedProductRow[]; errors: CsvRowError[] } {
  const errors: CsvRowError[] = [];
  const matrix = parseCsv(content);

  if (matrix.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "CSV file is empty" }] };
  }

  const headerRow = matrix[0].map(normalizeHeader);
  const required = ["name", "description", "price", "category_slug"] as const;

  for (const col of required) {
    if (!headerRow.includes(col)) {
      errors.push({
        row: 1,
        field: col,
        message: `Missing required column: ${col}`,
      });
    }
  }

  if (errors.length > 0) {
    return { rows: [], errors };
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "No product rows found" }] };
  }

  if (dataRows.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          message: `Too many rows (max ${MAX_ROWS}). Split into smaller files.`,
        },
      ],
    };
  }

  const parsed: ParsedProductRow[] = [];
  const slugsInFile = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2;
    const raw = dataRows[i];
    const record: Record<string, string> = {};

    for (let c = 0; c < headerRow.length; c++) {
      const key = headerRow[c];
      if (key) record[key] = (raw[c] ?? "").trim();
    }

    const name = record.name ?? "";
    if (!name) {
      errors.push({ row: rowNumber, field: "name", message: "Name is required" });
      continue;
    }
    if (name.length > 120) {
      errors.push({
        row: rowNumber,
        field: "name",
        message: "Name must be 120 characters or less",
      });
      continue;
    }

    const description = record.description ?? "";
    if (!description) {
      errors.push({
        row: rowNumber,
        field: "description",
        message: "Description is required",
      });
      continue;
    }
    if (description.length > 2000) {
      errors.push({
        row: rowNumber,
        field: "description",
        message: "Description must be 2000 characters or less",
      });
      continue;
    }

    const priceCents = dollarsToCents(record.price ?? "");
    if (priceCents === null || priceCents < 0) {
      errors.push({
        row: rowNumber,
        field: "price",
        message: "Price must be a valid number (e.g. 48.00)",
      });
      continue;
    }

    const categorySlug = (record.category_slug ?? "").toLowerCase();
    if (!categorySlug) {
      errors.push({
        row: rowNumber,
        field: "category_slug",
        message: "category_slug is required",
      });
      continue;
    }
    if (!existingCategorySlugs.has(categorySlug)) {
      errors.push({
        row: rowNumber,
        field: "category_slug",
        message: `Unknown category slug "${categorySlug}"`,
      });
      continue;
    }

    let slug = (record.slug ?? "").toLowerCase();
    if (!slug) slug = slugify(name);
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      errors.push({
        row: rowNumber,
        field: "slug",
        message: "Slug must be lowercase letters, numbers, and hyphens",
      });
      continue;
    }
    if (slug.length > 120) {
      errors.push({
        row: rowNumber,
        field: "slug",
        message: "Slug must be 120 characters or less",
      });
      continue;
    }

    if (slugsInFile.has(slug)) {
      errors.push({
        row: rowNumber,
        field: "slug",
        message: `Duplicate slug "${slug}" in CSV`,
      });
      continue;
    }
    if (existingProductSlugs.has(slug)) {
      errors.push({
        row: rowNumber,
        field: "slug",
        message: `Slug "${slug}" already exists in catalog`,
      });
      continue;
    }

    const imageRaw = record.image_url ?? "";
    let imageUrl: string | null = null;
    if (imageRaw) {
      if (!isValidUrl(imageRaw)) {
        errors.push({
          row: rowNumber,
          field: "image_url",
          message: "image_url must be a valid http(s) URL",
        });
        continue;
      }
      if (imageRaw.length > 2048) {
        errors.push({
          row: rowNumber,
          field: "image_url",
          message: "image_url is too long",
        });
        continue;
      }
      imageUrl = imageRaw;
    }

    const featured = parseBoolean(record.featured ?? "", false);
    if (featured === null) {
      errors.push({
        row: rowNumber,
        field: "featured",
        message: "featured must be true/false, yes/no, or 1/0",
      });
      continue;
    }

    const inStock = parseBoolean(record.in_stock ?? "", true);
    if (inStock === null) {
      errors.push({
        row: rowNumber,
        field: "in_stock",
        message: "in_stock must be true/false, yes/no, or 1/0",
      });
      continue;
    }

    slugsInFile.add(slug);
    existingProductSlugs.add(slug);

    parsed.push({
      name,
      slug,
      description,
      priceCents,
      categorySlug,
      imageUrl,
      featured,
      inStock,
    });
  }

  return { rows: parsed, errors };
}
