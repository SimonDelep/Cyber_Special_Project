import { parseCsvToRecords } from "@/lib/csv/parse";
import { productSchema } from "@/lib/validations/product";
import type { ProductInput } from "@/lib/validations/product";

export const PRODUCT_CSV_HEADERS = [
  "name",
  "slug",
  "description",
  "price",
  "imageUrl",
  "category",
  "stock",
] as const;

export const PRODUCT_CSV_MAX_ROWS = 100;
export const PRODUCT_CSV_MAX_BYTES = 512 * 1024;

export const PRODUCT_CSV_HELP = {
  title: "Bulk import from CSV",
  rules: [
    "UTF-8 encoded .csv file with a header row, then one product per line.",
    "Use comma (,) between columns (Excel FR may use ; — that is also supported).",
    `Required columns: name, slug, price, category. Optional: description, imageUrl, stock.`,
    "slug must be lowercase letters, numbers, and hyphens (e.g. wireless-mouse).",
    "price is in CAD (e.g. 29.99). stock is a whole number; leave empty if unknown.",
    "imageUrl must be a full https URL or left empty.",
    "category examples: phones, laptops, audio, accessories.",
    "Duplicate slugs in the file or already in the shop are skipped with an error message.",
  ],
  exampleHeader: PRODUCT_CSV_HEADERS.join(","),
  exampleRow:
    'Wireless Mouse,wireless-mouse,"Ergonomic mouse",29.99,https://images.unsplash.com/photo-1,accessories,50',
};

function rowToProductInput(record: Record<string, string>) {
  return {
    name: record.name,
    slug: record.slug,
    description: record.description || undefined,
    price: record.price,
    imageUrl: record.imageUrl || "",
    category: record.category,
    stock: record.stock ?? "",
  };
}

export type ParsedProductRow =
  | { rowNumber: number; data: ProductInput }
  | { rowNumber: number; error: string };

export function parseProductCsvFile(text: string):
  | { rows: ParsedProductRow[] }
  | { error: string } {
  const parsed = parseCsvToRecords(text, PRODUCT_CSV_HEADERS);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  if (parsed.rows.length > PRODUCT_CSV_MAX_ROWS) {
    return {
      error: `Too many rows (${parsed.rows.length}). Maximum is ${PRODUCT_CSV_MAX_ROWS} products per file.`,
    };
  }

  const rows: ParsedProductRow[] = parsed.rows.map((record, index) => {
    const rowNumber = index + 2;
    const result = productSchema.safeParse(rowToProductInput(record));
    if (!result.success) {
      const messages = Object.entries(result.error.flatten().fieldErrors)
        .flatMap(([field, errs]) =>
          (errs ?? []).map((msg) => `${field}: ${msg}`)
        )
        .join("; ");
      return { rowNumber, error: messages || "Invalid row data." };
    }
    return { rowNumber, data: result.data };
  });

  return { rows };
}
