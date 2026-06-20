import { z } from "zod";
import { slugify } from "@/lib/utils";

const REQUIRED_HEADERS = [
  "name",
  "description",
  "price",
  "category",
] as const;


const csvProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().min(1, "Description is required").max(2000),
  price: z.number().positive("Price must be greater than 0"),
  category: z.enum(["CANDLES", "INCENSE_HOLDERS", "DIFFUSERS"], {
    error: "Category must be CANDLES, INCENSE_HOLDERS, or DIFFUSERS",
  }),
  imageUrl: z.string().url().optional().or(z.literal("")),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export type ParsedCsvProduct = z.infer<typeof csvProductSchema>;

export type CsvImportRowError = {
  row: number;
  message: string;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
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
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value "${value}"`);
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

export function parseProductsCsv(text: string): {
  products: { row: number; data: ParsedCsvProduct }[];
  errors: CsvImportRowError[];
} {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      products: [],
      errors: [{ row: 0, message: "CSV must include a header row and at least one product row" }],
    };
  }

  const headers = parseCsvLine(lines[0]!).map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missing.length > 0) {
    return {
      products: [],
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missing.join(", ")}`,
        },
      ],
    };
  }

  const products: { row: number; data: ParsedCsvProduct }[] = [];
  const errors: CsvImportRowError[] = [];

  for (let index = 1; index < lines.length; index++) {
    const rowNumber = index + 1;
    const values = parseCsvLine(lines[index]!);
    const record: Record<string, string> = {};

    headers.forEach((header, columnIndex) => {
      record[header] = values[columnIndex] ?? "";
    });

    if (Object.values(record).every((value) => !value.trim())) {
      continue;
    }

    try {
      const price = Number.parseFloat(record.price ?? "");
      const slug = record.slug?.trim() || undefined;
      const imageUrl = record.imageurl?.trim() || "";
      const inStock = parseBoolean(record.instock, true);
      const featured = parseBoolean(record.featured, false);

      const parsed = csvProductSchema.safeParse({
        name: record.name?.trim(),
        slug: slug === "" ? undefined : slug,
        description: record.description?.trim(),
        price,
        category: record.category?.trim().toUpperCase(),
        imageUrl,
        inStock,
        featured,
      });

      if (!parsed.success) {
        errors.push({
          row: rowNumber,
          message: parsed.error.issues[0]?.message ?? "Invalid row data",
        });
        continue;
      }

      const data = parsed.data;
      products.push({
        row: rowNumber,
        data: {
          ...data,
          slug: data.slug || slugify(data.name),
        },
      });
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Invalid row data",
      });
    }
  }

  return { products, errors };
}
