import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { requireAdmin } from "@/lib/auth/admin";
import {
  MAX_CSV_IMPORT_ROWS,
  parseProductCsv,
  type CsvImportRowError,
} from "@/lib/admin/csv-products";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 512 * 1024;

export async function POST(request: Request) {
  try {
    const { user: admin, error } = await requireAdmin();
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No CSV file provided");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return jsonError("File must be a .csv");
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError("CSV file must be 512 KB or smaller");
    }

    const text = await file.text();
    const { rows, errors: parseErrors } = parseProductCsv(text);

    if (rows.length > MAX_CSV_IMPORT_ROWS) {
      return jsonError(`CSV may contain at most ${MAX_CSV_IMPORT_ROWS} product rows`);
    }

    const importErrors: CsvImportRowError[] = [...parseErrors];
    const created: Awaited<ReturnType<typeof prisma.product.create>>[] = [];

    for (const row of rows) {
      const existing = await prisma.product.findUnique({
        where: { slug: row.slug },
      });

      if (existing) {
        importErrors.push({
          row: row.row,
          message: `Slug "${row.slug}" already exists in catalog`,
        });
        continue;
      }

      try {
        const product = await prisma.product.create({
          data: {
            name: row.name,
            slug: row.slug,
            description: row.description,
            priceCents: row.priceCents,
            category: row.category,
            imageUrl: row.imageUrl,
            featured: row.featured,
            inStock: row.inStock,
          },
        });
        created.push(product);

        await logEvent({
          category: "ADMIN",
          action: AuditAction.ADMIN_PRODUCT_CREATE,
          status: "SUCCESS",
          message: `Admin "${admin.username}" created product "${product.name}" (CSV import)`,
          userId: admin.id,
          username: admin.username,
          request,
          metadata: { productId: product.id, slug: product.slug, source: "csv" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create product";
        importErrors.push({ row: row.row, message });
      }
    }

    if (created.length > 0) {
      await logEvent({
        category: "ADMIN",
        action: AuditAction.ADMIN_PRODUCT_CSV_IMPORT,
        status: created.length === rows.length && importErrors.length === parseErrors.length
          ? "SUCCESS"
          : "INFO",
        message: `Admin "${admin.username}" imported ${created.length} product(s) from CSV`,
        userId: admin.id,
        username: admin.username,
        request,
        metadata: {
          created: created.length,
          failed: importErrors.length - parseErrors.length,
          fileName: file.name,
        },
      });
    }

    return jsonOk({
      created: created.length,
      failed: importErrors.length,
      products: created,
      errors: importErrors,
    });
  } catch (err) {
    console.error("[admin/products/import POST]", err);
    return jsonError("Failed to import products", 500);
  }
}
