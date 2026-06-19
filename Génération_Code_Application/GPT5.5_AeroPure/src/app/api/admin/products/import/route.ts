import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { parseCsvToRecords } from "@/lib/admin/csv";
import {
  parseProductRow,
  validateCsvHeaders,
} from "@/lib/admin/product-import";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

const MAX_ROWS = 500;

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No CSV file provided", 400);
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return jsonError("File must be a .csv", 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      return jsonError("File too large (max 2 MB)", 400);
    }

    const text = await file.text();
    let records: Record<string, string>[];

    try {
      records = parseCsvToRecords(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid CSV format";
      return jsonError(message, 400);
    }

    if (records.length === 0) {
      return jsonError("CSV contains no data rows", 400);
    }

    if (records.length > MAX_ROWS) {
      return jsonError(`Maximum ${MAX_ROWS} rows per import`, 400);
    }

    const headers = Object.keys(records[0]);
    const headerError = validateCsvHeaders(headers);
    if (headerError) return jsonError(headerError, 400);

    const errors: { row: number; slug?: string; message: string }[] = [];
    const validRows = [];

    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2;
      const result = parseProductRow(records[i], rowNumber);
      if (!result.ok) {
        errors.push({
          row: result.rowNumber,
          slug: result.slug,
          message: result.message,
        });
      } else {
        validRows.push(result.data);
      }
    }

    const slugsInFile = validRows.map((r) => r.slug);
    const duplicateInFile = slugsInFile.filter(
      (s, i) => slugsInFile.indexOf(s) !== i,
    );
    if (duplicateInFile.length > 0) {
      return jsonError(
        `Duplicate slugs in CSV: ${[...new Set(duplicateInFile)].join(", ")}`,
        400,
      );
    }

    const existing = await prisma.product.findMany({
      where: { slug: { in: slugsInFile } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((p) => p.slug));

    const createdProducts = [];

    for (const row of validRows) {
      if (existingSlugs.has(row.slug)) {
        errors.push({
          row: row.rowNumber,
          slug: row.slug,
          message: "Slug already exists in catalog",
        });
        continue;
      }

      try {
        const product = await prisma.product.create({
          data: {
            slug: row.slug,
            name: row.name,
            description: row.description,
            price: row.price,
            category: row.category,
            featured: row.featured,
            inStock: row.inStock,
            imageUrl: row.imageUrl,
          },
        });
        createdProducts.push({
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          category: product.category,
          featured: product.featured,
          inStock: product.inStock,
          imageUrl: product.imageUrl,
        });
        existingSlugs.add(row.slug);
      } catch {
        errors.push({
          row: row.rowNumber,
          slug: row.slug,
          message: "Failed to create product",
        });
      }
    }

    if (createdProducts.length > 0) {
      await logEvent({
        level: LogLevel.INFO,
        category: LogCategory.ADMIN,
        action: LOG_ACTIONS.ADMIN_PRODUCT_CSV_IMPORT,
        message: `Admin "${auth.user.username}" imported ${createdProducts.length} product(s) from CSV`,
        userId: auth.user.id,
        username: auth.user.username,
        metadata: {
          created: createdProducts.length,
          errors: errors.length,
          fileName: file.name,
        },
        request,
      });
    }

    return jsonSuccess({
      message: `Imported ${createdProducts.length} product(s)`,
      created: createdProducts.length,
      failed: errors.length,
      errors,
      products: createdProducts,
    });
  } catch (error) {
    console.error("[products import]", error);
    return jsonError("Import failed", 500);
  }
}
