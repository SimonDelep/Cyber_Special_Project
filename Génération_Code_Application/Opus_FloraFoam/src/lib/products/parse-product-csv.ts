import { ProductCategory } from "@prisma/client";
import { z } from "zod";

const REQUIRED_HEADERS = [
  "slug",
  "name",
  "description",
  "category",
  "price_dollars",
  "image_url",
  "featured",
  "in_stock",
] as const;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "n"].includes(normalized)) return false;
  throw new Error(`Invalid boolean "${value}" (use true/false, yes/no, or 1/0).`);
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

const productCsvRowSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(slugRegex, "Slug must use lowercase letters, numbers, and hyphens."),
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  category: z.nativeEnum(ProductCategory, {
    errorMap: () => ({
      message: "Category must be SERUM, NIGHT_CREAM, or EYE_PATCH.",
    }),
  }),
  priceDollars: z
    .string()
    .trim()
    .refine((value) => {
      const n = Number(value);
      return !Number.isNaN(n) && n > 0;
    }, "Price must be a number greater than zero."),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine(
      (value) => {
        if (!value) return true;
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Image URL must be a valid http(s) URL or empty." },
    ),
  featured: z.boolean(),
  inStock: z.boolean(),
});

export type ParsedProductCsvRow = z.infer<typeof productCsvRowSchema> & {
  priceCents: number;
};

export type CsvRowError = {
  row: number;
  message: string;
};

export type ParseProductCsvResult =
  | { ok: true; rows: ParsedProductCsvRow[] }
  | { ok: false; error: string; rowErrors?: CsvRowError[] };

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

export function parseProductCsv(content: string): ParseProductCsvResult {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "CSV must include a header row and at least one product row.",
    };
  }

  const headers = parseCsvRow(lines[0]).map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Missing required column(s): ${missing.join(", ")}.`,
    };
  }

  const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
  const rowErrors: CsvRowError[] = [];
  const parsedRows: ParsedProductCsvRow[] = [];
  const slugsInFile = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = parseCsvRow(lines[i]);

    if (values.length === 1 && values[0] === "") {
      continue;
    }

    const get = (key: (typeof REQUIRED_HEADERS)[number]) => values[headerIndex[key]] ?? "";

    try {
      const featured = parseBoolean(get("featured"));
      const inStock = parseBoolean(get("in_stock"));
      const priceDollars = get("price_dollars");

      const validated = productCsvRowSchema.safeParse({
        slug: get("slug"),
        name: get("name"),
        description: get("description"),
        category: get("category").toUpperCase(),
        priceDollars,
        imageUrl: get("image_url"),
        featured,
        inStock,
      });

      if (!validated.success) {
        rowErrors.push({
          row: rowNumber,
          message: validated.error.issues[0]?.message ?? "Invalid row data.",
        });
        continue;
      }

      if (slugsInFile.has(validated.data.slug)) {
        rowErrors.push({
          row: rowNumber,
          message: `Duplicate slug "${validated.data.slug}" in CSV file.`,
        });
        continue;
      }

      slugsInFile.add(validated.data.slug);
      parsedRows.push({
        ...validated.data,
        priceCents: Math.round(Number(validated.data.priceDollars) * 100),
      });
    } catch (error) {
      rowErrors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Invalid row data.",
      });
    }
  }

  if (parsedRows.length === 0) {
    return {
      ok: false,
      error: rowErrors.length
        ? "No valid product rows found in the CSV file."
        : "CSV file contains no product rows.",
      rowErrors,
    };
  }

  if (rowErrors.length > 0) {
    return { ok: false, error: "Fix the row errors below before importing.", rowErrors };
  }

  return { ok: true, rows: parsedRows };
}

export const PRODUCT_CSV_HEADERS = REQUIRED_HEADERS.join(",");
