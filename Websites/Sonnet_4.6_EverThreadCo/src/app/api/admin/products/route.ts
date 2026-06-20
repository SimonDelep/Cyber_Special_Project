import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { prisma } from "@/lib/prisma";
import { adminProductSchema } from "@/lib/validations/admin";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return NextResponse.json({ products, categories });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    const slugTaken = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    if (slugTaken) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        priceCents: data.priceCents,
        imageUrl: data.imageUrl?.trim() || null,
        featured: data.featured ?? false,
        inStock: data.inStock ?? true,
        categoryId: data.categoryId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message: "Product created", product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}
