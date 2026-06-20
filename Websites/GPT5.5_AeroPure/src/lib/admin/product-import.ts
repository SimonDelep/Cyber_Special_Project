import { ProductCategory } from "@prisma/client";
import { productSchema } from "@/lib/admin/validation";
import { parseBoolean } from "@/lib/admin/csv";

const REQUIRED_COLUMNS = [
  "slug",
  "name",
  "description",
  "price",
  "category",
] as const;

export type ProductImportRow = {
  rowNumber: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  featured: boolean;
  inStock: boolean;
  imageUrl: string | null;
};

export type RowParseResult =
  | { ok: true; data: ProductImportRow }
  | { ok: false; rowNumber: number; slug?: string; message: string };

export function validateCsvHeaders(headers: string[]): string | null {
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    return `Missing required columns: ${missing.join(", ")}`;
  }
  return null;
}

export function parseProductRow(
  record: Record<string, string>,
  rowNumber: number,
): RowParseResult {
  try {
    const slug = record.slug?.trim();
    const categoryRaw = record.category?.trim();

    const featured = parseBoolean(record.featured, false);
    const inStock = parseBoolean(record.inStock, true);
    const imageUrlRaw = record.imageurl?.trim() || record.imageUrl?.trim() || "";

    const parsed = productSchema.safeParse({
      slug,
      name: record.name?.trim(),
      description: record.description?.trim(),
      price: record.price?.trim(),
      category: categoryRaw,
      featured,
      inStock,
      imageUrl: imageUrlRaw,
    });

    if (!parsed.success) {
      return {
        ok: false,
        rowNumber,
        slug,
        message: parsed.error.issues[0]?.message ?? "Invalid row data",
      };
    }

    return {
      ok: true,
      data: {
        rowNumber,
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        category: parsed.data.category,
        featured: parsed.data.featured ?? false,
        inStock: parsed.data.inStock ?? true,
        imageUrl: parsed.data.imageUrl || null,
      },
    };
  } catch (error) {
    return {
      ok: false,
      rowNumber,
      slug: record.slug,
      message: error instanceof Error ? error.message : "Invalid row",
    };
  }
}
