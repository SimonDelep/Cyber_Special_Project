import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductReviews } from "@/lib/reviews";
import { reviewSchema } from "@/lib/validations/review";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviews = await getProductReviews(id);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to leave a review" },
        { status: 401 },
      );
    }

    const { id: productId } = await context.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review" },
        { status: 400 },
      );
    }

    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: { productId, userId: user.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        imageUrl: review.imageUrl,
        createdAt: review.createdAt.toISOString(),
        user: review.user,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
