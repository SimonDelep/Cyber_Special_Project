import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { db } from "@/lib/db";
import { productCreateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

export async function GET() {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const products = await db.product.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const existing = await db.product.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 },
      );
    }

    const product = await db.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        category: data.category,
        priceCents: data.priceCents,
        imageUrl: data.imageUrl?.trim() || null,
        origin: data.origin?.trim() || null,
        roastLevel: data.roastLevel?.trim() || null,
        isEthical: data.isEthical ?? true,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create product" },
      { status: 500 },
    );
  }
}
