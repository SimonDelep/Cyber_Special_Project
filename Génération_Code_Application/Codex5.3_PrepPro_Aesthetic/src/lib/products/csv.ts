import { createProduct, slugTaken } from "@/db/products";
import type { Product } from "@/db/schema";
import {
  slugify,
  validateProductInput,
  type ProductCategory,
} from "@/lib/products/validate";

const REQUIRED_COLUMNS = [
  "name",
  "description",
  "category",
] as const;

const OPTIONAL_COLUMNS = [
  "slug",
  "price_cents",
  "price_dollars",
  "image_url",
  "featured",
  "stackable",
  "leak_proof",
  "capacity_ml",
] as const;

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type CsvImportResult = {
  created: number;
  failed: number;
  products: Product[];
  errors: CsvImportRowError[];
};

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Minimal RFC-style CSV row parser (quoted fields, commas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const input = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n") {
      row.push(field.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function parseBoolean(value: string, defaultValue: boolean): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return defaultValue;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return defaultValue;
}

function parsePriceCents(
  priceCentsRaw: string,
  priceDollarsRaw: string,
): { cents: number } | { error: string } {
  const centsStr = priceCentsRaw.trim();
  const dollarsStr = priceDollarsRaw.trim();

  if (centsStr) {
    const cents = Number.parseInt(centsStr, 10);
    if (!Number.isInteger(cents) || cents < 0) {
      return { error: "price_cents must be a non-negative integer." };
    }
    return { cents };
  }

  if (dollarsStr) {
    const dollars = Number.parseFloat(dollarsStr);
    if (Number.isNaN(dollars) || dollars < 0) {
      return { error: "price_dollars must be a non-negative number." };
    }
    return { cents: Math.round(dollars * 100) };
  }

  return { error: "Provide price_cents or price_dollars." };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function resolveUniqueSlug(baseSlug: string): string {
  let slug = baseSlug;
  if (!slugTaken(slug)) return slug;
  slug = `${baseSlug}-${Date.now().toString(36)}`;
  return slug;
}

export function importProductsFromCsv(csvText: string): CsvImportResult {
  const rows = parseCsv(csvText);
  const result: CsvImportResult = {
    created: 0,
    failed: 0,
    products: [],
    errors: [],
  };

  if (rows.length < 2) {
    result.errors.push({
      row: 0,
      message: "CSV must include a header row and at least one product row.",
    });
    result.failed = 1;
    return result;
  }

  const headers = rows[0]!.map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    result.errors.push({
      row: 1,
      message: `Missing required column(s): ${missing.join(", ")}.`,
    });
    result.failed = 1;
    return result;
  }

  const hasPrice =
    headers.includes("price_cents") || headers.includes("price_dollars");
  if (!hasPrice) {
    result.errors.push({
      row: 1,
      message: "Missing price column: add price_cents or price_dollars.",
    });
    result.failed = 1;
    return result;
  }

  const col = (name: string) => headers.indexOf(name);

  for (let i = 1; i < rows.length; i++) {
    const line = rows[i]!;
    const rowNum = i + 1;

    if (line.every((cell) => !cell.trim())) continue;

    const get = (name: string) => {
      const idx = col(name);
      return idx >= 0 ? (line[idx] ?? "") : "";
    };

    const name = get("name").trim();
    const description = get("description").trim();
    const category = get("category").trim() as ProductCategory;
    let slug = get("slug").trim() || slugify(name);
    const priceResult = parsePriceCents(get("price_cents"), get("price_dollars"));

    if (!name) {
      result.errors.push({ row: rowNum, message: "name is required." });
      result.failed++;
      continue;
    }

    if (!("cents" in priceResult)) {
      result.errors.push({ row: rowNum, message: priceResult.error });
      result.failed++;
      continue;
    }

    const imageUrl = get("image_url").trim() || "/images/solo-prep.svg";
    const featured = parseBoolean(get("featured"), false);
    const stackable = parseBoolean(get("stackable"), true);
    const leakProof = parseBoolean(get("leak_proof"), false);
    const capacityRaw = get("capacity_ml").trim();
    const capacityMl =
      capacityRaw === "" ? null : Number.parseInt(capacityRaw, 10);

    const validation = validateProductInput({
      name,
      slug,
      description,
      category,
      priceCents: priceResult.cents,
      imageUrl,
      capacityMl,
    });

    if (!validation.ok) {
      result.errors.push({ row: rowNum, message: validation.error });
      result.failed++;
      continue;
    }

    slug = resolveUniqueSlug(slug);

    try {
      const product = createProduct({
        name,
        slug,
        description,
        category,
        priceCents: priceResult.cents,
        imageUrl,
        featured,
        stackable,
        leakProof,
        capacityMl: capacityMl ?? null,
      });
      result.products.push(product);
      result.created++;
    } catch {
      result.errors.push({
        row: rowNum,
        message: "Could not insert product (database error).",
      });
      result.failed++;
    }
  }

  return result;
}

export const CSV_COLUMN_DOCS = {
  required: [...REQUIRED_COLUMNS, "price_cents or price_dollars"],
  optional: [...OPTIONAL_COLUMNS],
};
