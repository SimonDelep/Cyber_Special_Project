import { parseCsv } from "@/lib/csv/parse-csv";
import { slugify } from "@/lib/format";
import { productCreateSchema } from "@/lib/validations/admin";
import type { z } from "zod";

export type ProductImportRow = z.infer<typeof productCreateSchema>;

export type ProductImportError = {
  row: number;
  message: string;
};

export type ProductImportResult = {
  products: ProductImportRow[];
  errors: ProductImportError[];
};

const HEADER_ALIASES: Record<string, string> = {
  slug: "slug",
  name: "name",
  description: "description",
  category: "category",
  price_dollars: "price_dollars",
  price: "price_dollars",
  price_usd: "price_dollars",
  pricecents: "price_cents",
  price_cents: "price_cents",
  image_url: "image_url",
  imageurl: "image_url",
  image: "image_url",
  origin: "origin",
  roast_level: "roast_level",
  roastlevel: "roast_level",
  roast: "roast_level",
  is_ethical: "is_ethical",
  ethical: "is_ethical",
  is_active: "is_active",
  active: "is_active",
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string, defaultValue: boolean): boolean | null {
  const v = value.trim().toLowerCase();
  if (!v) return defaultValue;
  if (["true", "1", "yes", "y"].includes(v)) return true;
  if (["false", "0", "no", "n"].includes(v)) return false;
  return null;
}

function parsePriceCents(
  priceDollars: string,
  priceCents: string,
): { cents: number } | { error: string } {
  if (priceCents.trim()) {
    const cents = Number.parseInt(priceCents.trim(), 10);
    if (Number.isNaN(cents) || cents < 0) {
      return { error: "price_cents must be a non-negative integer" };
    }
    return { cents };
  }

  if (!priceDollars.trim()) {
    return { error: "price_dollars or price_cents is required" };
  }

  const dollars = Number.parseFloat(priceDollars.trim());
  if (Number.isNaN(dollars) || dollars < 0) {
    return { error: "price_dollars must be a non-negative number" };
  }

  return { cents: Math.round(dollars * 100) };
}

export function parseProductsImportCsv(csvText: string): ProductImportResult {
  const errors: ProductImportError[] = [];
  const products: ProductImportRow[] = [];

  const rows = parseCsv(csvText.trim());
  if (rows.length === 0) {
    return {
      products: [],
      errors: [{ row: 0, message: "CSV file is empty" }],
    };
  }

  const headerRow = rows[0].map(normalizeHeader);
  const columnMap = new Map<string, number>();

  for (let i = 0; i < headerRow.length; i += 1) {
    const canonical = HEADER_ALIASES[headerRow[i]];
    if (canonical) {
      columnMap.set(canonical, i);
    }
  }

  const required = ["name", "description", "category"];
  for (const col of required) {
    if (!columnMap.has(col)) {
      errors.push({
        row: 1,
        message: `Missing required column: ${col}`,
      });
    }
  }

  if (!columnMap.has("price_dollars") && !columnMap.has("price_cents")) {
    errors.push({
      row: 1,
      message: "Missing required column: price_dollars (or price_cents)",
    });
  }

  if (errors.length > 0) {
    return { products: [], errors };
  }

  const getCell = (row: string[], key: string) => {
    const index = columnMap.get(key);
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  const seenSlugs = new Set<string>();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const lineNumber = rowIndex + 1;

    if (row.every((cell) => !cell.trim())) continue;

    const name = getCell(row, "name");
    const description = getCell(row, "description");
    const categoryRaw = getCell(row, "category").toUpperCase();
    const slugRaw = getCell(row, "slug");
    const slug = slugRaw || slugify(name);

    const priceResult = parsePriceCents(
      getCell(row, "price_dollars"),
      getCell(row, "price_cents"),
    );

    if ("error" in priceResult) {
      errors.push({ row: lineNumber, message: priceResult.error });
      continue;
    }

    const ethical = parseBoolean(getCell(row, "is_ethical"), true);
    if (ethical === null) {
      errors.push({
        row: lineNumber,
        message: "is_ethical must be true/false, yes/no, or 1/0",
      });
      continue;
    }

    const active = parseBoolean(getCell(row, "is_active"), true);
    if (active === null) {
      errors.push({
        row: lineNumber,
        message: "is_active must be true/false, yes/no, or 1/0",
      });
      continue;
    }

    if (!slug) {
      errors.push({ row: lineNumber, message: "Could not derive a valid slug" });
      continue;
    }

    if (seenSlugs.has(slug)) {
      errors.push({
        row: lineNumber,
        message: `Duplicate slug in file: ${slug}`,
      });
      continue;
    }
    seenSlugs.add(slug);

    const imageUrl = getCell(row, "image_url");
    const origin = getCell(row, "origin");
    const roastLevel = getCell(row, "roast_level");

    const parsed = productCreateSchema.safeParse({
      slug,
      name,
      description,
      category: categoryRaw,
      priceCents: priceResult.cents,
      imageUrl: imageUrl || null,
      origin: origin || null,
      roastLevel: roastLevel || null,
      isEthical: ethical,
      isActive: active,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      errors.push({
        row: lineNumber,
        message: firstIssue?.message ?? "Validation failed",
      });
      continue;
    }

    products.push(parsed.data);
  }

  if (products.length === 0 && errors.length === 0) {
    errors.push({ row: 0, message: "No product rows found in CSV" });
  }

  return { products, errors };
}
