import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { normalizeReviewImageUrl } from "@/lib/auth/upload";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations/review";

type RouteParams = { params: Promise<{ productId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { productId } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const imageUrl = normalizeReviewImageUrl(parsed.data.imageUrl ?? null);
    if (parsed.data.imageUrl && parsed.data.imageUrl.trim() !== "" && !imageUrl) {
      return NextResponse.json(
        { error: "Image must be a valid http(s) URL or an uploaded review image path" },
        { status: 400 },
      );
    }

    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId,
        },
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
        userId: auth.userId,
        rating: parsed.data.rating,
        title: parsed.data.title?.trim() || null,
        body: parsed.data.body.trim(),
        imageUrl,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Review submitted", review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit review" }, { status: 500 });
  }
}
