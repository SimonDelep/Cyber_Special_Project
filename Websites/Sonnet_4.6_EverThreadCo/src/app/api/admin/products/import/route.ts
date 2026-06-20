import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { parseProductCsv } from "@/lib/admin/parse-product-csv";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const actor = await prisma.user.findUnique({
    where: { id: auth.session.user.id },
    select: { username: true },
  });

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must have a .csv extension" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 2 MB)" },
        { status: 400 },
      );
    }

    const content = await file.text();

    const [categories, existingProducts] = await Promise.all([
      prisma.category.findMany({ select: { id: true, slug: true } }),
      prisma.product.findMany({ select: { slug: true } }),
    ]);

    const categoryBySlug = new Map(
      categories.map((c) => [c.slug.toLowerCase(), c.id]),
    );
    const categorySlugs = new Set(categoryBySlug.keys());
    const existingSlugs = new Set(
      existingProducts.map((p) => p.slug.toLowerCase()),
    );

    const { rows, errors } = parseProductCsv(
      content,
      categorySlugs,
      existingSlugs,
    );

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "CSV validation failed", errors },
        { status: 400 },
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No products to import" }, { status: 400 });
    }

    const created = await prisma.$transaction(
      rows.map((row) =>
        prisma.product.create({
          data: {
            name: row.name,
            slug: row.slug,
            description: row.description,
            priceCents: row.priceCents,
            imageUrl: row.imageUrl,
            featured: row.featured,
            inStock: row.inStock,
            categoryId: categoryBySlug.get(row.categorySlug)!,
          },
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        }),
      ),
    );

    await logEvent({
      category: "ADMIN",
      action: EventActions.ADMIN_PRODUCT_IMPORT,
      message: `Imported ${created.length} product(s) from CSV`,
      userId: auth.session.user.id,
      username: actor?.username ?? null,
      request,
      metadata: {
        count: created.length,
        slugs: created.map((p) => p.slug),
      },
    });

    return NextResponse.json({
      message: `Imported ${created.length} product${created.length === 1 ? "" : "s"}`,
      created: created.length,
      products: created,
    });
  } catch {
    return NextResponse.json({ error: "Unable to import products" }, { status: 500 });
  }
}
