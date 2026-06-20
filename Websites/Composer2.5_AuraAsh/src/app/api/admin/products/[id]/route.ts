import { NextResponse } from "next/server";
import { ProductCategory } from "@/generated/prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import { productUpdateSchema } from "@/lib/validations/admin";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  inStock: true,
  featured: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RouteContext = { params: Promise<{ id: string }> };

function serializeProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: { toString(): string };
  category: string;
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...product,
    price: decimalToNumber(product.price),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product: serializeProduct(product) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = productUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const data = parsed.data;

  if (data.slug && data.slug !== existing.slug) {
    const taken = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Slug is already taken" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.category !== undefined && {
        category: data.category as ProductCategory,
      }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.inStock !== undefined && { inStock: data.inStock }),
      ...(data.featured !== undefined && { featured: data.featured }),
    },
    select: productSelect,
  });

  return NextResponse.json({ product: serializeProduct(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
