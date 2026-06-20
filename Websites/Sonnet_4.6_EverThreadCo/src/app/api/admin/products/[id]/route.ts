import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { prisma } from "@/lib/prisma";
import { adminProductUpdateSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = adminProductUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = parsed.data;

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.priceCents !== undefined ? { priceCents: data.priceCents } : {}),
        ...(data.imageUrl !== undefined
          ? { imageUrl: data.imageUrl?.trim() || null }
          : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.inStock !== undefined ? { inStock: data.inStock } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message: "Product updated", product });
  } catch {
    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
