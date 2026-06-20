import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/admin-api";
import { db } from "@/lib/db";
import { productUpdateSchema } from "@/lib/validations/admin";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = parsed.data;

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await db.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "Slug already in use" },
          { status: 409 },
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl?.trim() || null,
        }),
        ...(data.origin !== undefined && {
          origin: data.origin?.trim() || null,
        }),
        ...(data.roastLevel !== undefined && {
          roastLevel: data.roastLevel?.trim() || null,
        }),
        ...(data.isEthical !== undefined && { isEthical: data.isEthical }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Unable to update product" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authResult = await requireAdminApi();
  if ("error" in authResult) return authResult.error;

  const { id } = await params;

  try {
    await db.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to delete product. It may be linked to a subscription box.",
      },
      { status: 409 },
    );
  }
}
