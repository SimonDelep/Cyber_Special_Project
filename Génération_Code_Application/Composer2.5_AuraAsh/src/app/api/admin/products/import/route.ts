import { NextResponse } from "next/server";
import { ProductCategory } from "@/generated/prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";
import { prisma } from "@/lib/prisma";
import { parseProductsCsv } from "@/lib/products/csv";

export async function POST(request: Request) {
  const { user, error } = await requireAdminApi();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only .csv files are supported" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const { products, errors } = parseProductsCsv(text);

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: "No valid products found in CSV",
          created: 0,
          skipped: 0,
          errors,
        },
        { status: 400 },
      );
    }

    const created: { row: number; name: string; slug: string }[] = [];
    const skipped: { row: number; name: string; reason: string }[] = [];

    for (const entry of products) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: entry.data.slug },
      });

      if (existingSlug) {
        skipped.push({
          row: entry.row,
          name: entry.data.name,
          reason: `Slug "${entry.data.slug}" already exists`,
        });
        continue;
      }

      const product = await prisma.product.create({
        data: {
          name: entry.data.name,
          slug: entry.data.slug!,
          description: entry.data.description,
          price: entry.data.price,
          category: entry.data.category as ProductCategory,
          imageUrl: entry.data.imageUrl || null,
          inStock: entry.data.inStock ?? true,
          featured: entry.data.featured ?? false,
        },
        select: { name: true, slug: true },
      });

      created.push({
        row: entry.row,
        name: product.name,
        slug: product.slug,
      });
    }

    await logEvent({
      category: EventCategory.ADMIN,
      action: "PRODUCTS_CSV_IMPORT",
      status: created.length > 0 ? EventStatus.SUCCESS : EventStatus.WARNING,
      message: `CSV import by "${user!.username}": ${created.length} created, ${skipped.length} skipped`,
      userId: user!.id,
      username: user!.username,
      metadata: {
        fileName: file.name,
        created: created.length,
        skipped: skipped.length,
        parseErrors: errors.length,
      },
      request,
    });

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      createdProducts: created,
      skippedProducts: skipped,
      errors,
      message:
        created.length > 0
          ? `Imported ${created.length} product${created.length === 1 ? "" : "s"} successfully.`
          : "No products were imported.",
    });
  } catch {
    await logEvent({
      category: EventCategory.ADMIN,
      action: "PRODUCTS_CSV_IMPORT",
      status: EventStatus.FAILURE,
      message: "CSV product import failed",
      userId: user?.id,
      username: user?.username,
      request,
    });

    return NextResponse.json(
      { error: "Failed to import products from CSV" },
      { status: 500 },
    );
  }
}
