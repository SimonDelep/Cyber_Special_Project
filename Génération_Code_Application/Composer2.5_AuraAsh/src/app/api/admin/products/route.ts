import { NextResponse } from "next/server";
import { ProductCategory } from "@/generated/prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, slugify } from "@/lib/utils";
import { productCreateSchema } from "@/lib/validations/admin";

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

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const products = await prisma.product.findMany({
    select: productSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    products: products.map(serializeProduct),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const parsed = productCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, description, price, category, imageUrl, inStock, featured } =
    parsed.data;

  let slug = parsed.data.slug ?? slugify(name);

  const slugTaken = await prisma.product.findUnique({ where: { slug } });
  if (slugTaken) {
    slug = `${slug}-${Date.now()}`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      category: category as ProductCategory,
      imageUrl: imageUrl || null,
      inStock: inStock ?? true,
      featured: featured ?? false,
    },
    select: productSelect,
  });

  return NextResponse.json(
    { product: serializeProduct(product) },
    { status: 201 },
  );
}
