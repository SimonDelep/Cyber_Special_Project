import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { parseProductsImportCsv } from "@/lib/csv/parse-products-import";
import { db } from "@/lib/db";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 512 * 1024;

export async function POST(request: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a .csv spreadsheet" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "CSV file must be smaller than 512 KB" },
        { status: 400 },
      );
    }

    const csvText = await file.text();
    const { products, errors: parseErrors } = parseProductsImportCsv(csvText);

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: "No valid products to import",
          created: 0,
          failed: parseErrors.length,
          errors: parseErrors,
        },
        { status: 400 },
      );
    }

    const existing = await db.product.findMany({
      where: { slug: { in: products.map((p) => p.slug) } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((p) => p.slug));

    const rowErrors = [...parseErrors];
    let created = 0;

    for (let i = 0; i < products.length; i += 1) {
      const product = products[i];

      if (existingSlugs.has(product.slug)) {
        rowErrors.push({
          row: i + 2,
          message: `Slug already exists in catalog: ${product.slug}`,
        });
        continue;
      }

      try {
        await db.product.create({
          data: {
            slug: product.slug,
            name: product.name,
            description: product.description,
            category: product.category,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl?.trim() || null,
            origin: product.origin?.trim() || null,
            roastLevel: product.roastLevel?.trim() || null,
            isEthical: product.isEthical ?? true,
            isActive: product.isActive ?? true,
          },
        });
        existingSlugs.add(product.slug);
        created += 1;
      } catch {
        rowErrors.push({
          row: i + 2,
          message: `Failed to create product: ${product.slug}`,
        });
      }
    }

    await logEvent({
      category: "ADMIN",
      action: LogAction.PRODUCT_CSV_IMPORT,
      message: `CSV import: ${created} product(s) created`,
      userId: authResult.admin.id,
      username: authResult.admin.username,
      request,
      metadata: {
        fileName: file.name,
        created,
        failed: rowErrors.length,
        attempted: products.length,
      },
      success: created > 0,
      level: created > 0 ? "INFO" : "WARN",
    });

    return NextResponse.json({
      created,
      failed: rowErrors.length,
      errors: rowErrors,
    });
  } catch (error) {
    console.error("[products/import]", error);
    return NextResponse.json(
      { error: "Unable to import products" },
      { status: 500 },
    );
  }
}
