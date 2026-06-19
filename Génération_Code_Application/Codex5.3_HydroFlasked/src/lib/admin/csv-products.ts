import { adminProductSchema } from "@/lib/admin/validation";
import { dollarInputToCents } from "@/lib/format";
import type { ProductCategory } from "../../../generated/prisma/client";

export const CSV_REQUIRED_HEADERS = [
  "name",
  "slug",
  "description",
  "category",
] as const;

export const CSV_OPTIONAL_HEADERS = [
  "price_dollars",
  "price_cents",
  "image_url",
  "featured",
  "in_stock",
] as const;

export type CsvImportRowError = {
  row: number;
  message: string;
};

export type ParsedProductRow = {
  row: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  category: ProductCategory;
  imageUrl: string | null;
  featured: boolean;
  inStock: boolean;
};

/** Parse CSV text into rows of fields (handles quoted commas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string, defaultValue: boolean): boolean | string {
  const v = value.trim().toLowerCase();
  if (!v) return defaultValue;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return "invalid";
}

function resolvePriceCents(
  priceDollars: string,
  priceCents: string,
): { cents: number } | { error: string } {
  if (priceCents.trim()) {
    const parsed = Number.parseInt(priceCents.trim(), 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return { error: "price_cents must be a positive integer" };
    }
    return { cents: parsed };
  }

  if (priceDollars.trim()) {
    const cents = dollarInputToCents(priceDollars.trim());
    if (cents === null || cents <= 0) {
      return { error: "price_dollars must be a positive number" };
    }
    return { cents };
  }

  return { error: "price_dollars or price_cents is required" };
}

export function parseProductCsv(text: string): {
  rows: ParsedProductRow[];
  errors: CsvImportRowError[];
} {
  const errors: CsvImportRowError[] = [];
  const table = parseCsv(text);

  if (table.length === 0) {
    return { rows: [], errors: [{ row: 0, message: "CSV file is empty" }] };
  }

  const headers = table[0].map(normalizeHeader);
  const missing = CSV_REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const hasPrice =
    headers.includes("price_dollars") || headers.includes("price_cents");
  if (!hasPrice) {
    return {
      rows: [],
      errors: [{ row: 1, message: "Missing price_dollars or price_cents column" }],
    };
  }

  const rows: ParsedProductRow[] = [];
  const slugsInFile = new Set<string>();

  for (let i = 1; i < table.length; i++) {
    const line = table[i];
    const rowNumber = i + 1;

    if (line.every((cell) => !cell.trim())) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = line[idx] ?? "";
    });

    const priceResult = resolvePriceCents(
      record.price_dollars ?? "",
      record.price_cents ?? "",
    );
    if ("error" in priceResult) {
      errors.push({ row: rowNumber, message: priceResult.error });
      continue;
    }

    const featuredRaw = parseBoolean(record.featured ?? "", false);
    if (featuredRaw === "invalid") {
      errors.push({ row: rowNumber, message: "featured must be true or false" });
      continue;
    }

    const inStockRaw = parseBoolean(record.in_stock ?? "", true);
    if (inStockRaw === "invalid") {
      errors.push({ row: rowNumber, message: "in_stock must be true or false" });
      continue;
    }

    const imageUrl = (record.image_url ?? "").trim() || null;

    const candidate = {
      name: record.name ?? "",
      slug: record.slug ?? "",
      description: record.description ?? "",
      priceCents: priceResult.cents,
      category: record.category ?? "",
      imageUrl,
      featured: featuredRaw,
      inStock: inStockRaw,
    };

    const parsed = adminProductSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(". "),
      });
      continue;
    }

    const slug = parsed.data.slug;
    if (slugsInFile.has(slug)) {
      errors.push({ row: rowNumber, message: `Duplicate slug "${slug}" in CSV` });
      continue;
    }
    slugsInFile.add(slug);

    rows.push({
      row: rowNumber,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      priceCents: parsed.data.priceCents,
      category: parsed.data.category,
      imageUrl: parsed.data.imageUrl ?? null,
      featured: parsed.data.featured ?? false,
      inStock: parsed.data.inStock ?? true,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: "No product rows found in CSV" });
  }

  return { rows, errors };
}

export const MAX_CSV_IMPORT_ROWS = 100;
