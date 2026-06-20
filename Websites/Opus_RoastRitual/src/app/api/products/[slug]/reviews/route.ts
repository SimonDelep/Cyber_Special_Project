import { NextResponse } from "next/server";

import { requireAuthApi } from "@/lib/auth/api-auth";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations/review";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const authResult = await requireAuthApi();
  if ("error" in authResult) return authResult.error;

  const { slug } = await params;

  try {
    const product = await db.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = await db.review.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId: authResult.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { rating, title, body: reviewBody, imageUrl } = parsed.data;

    const review = await db.review.create({
      data: {
        productId: product.id,
        userId: authResult.user.id,
        rating,
        title: title?.trim() || null,
        body: reviewBody.trim(),
        imageUrl: imageUrl?.trim() || null,
      },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        imageUrl: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to submit review" },
      { status: 500 },
    );
  }
}
