"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteLocalReviewImage } from "@/lib/reviews/image";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations/review";

export type ReviewActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function fieldErrorsFromZod(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to submit a review." };
  }

  const parsed = createReviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    imageUrl: formData.get("imageUrl"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid review.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, slug: true },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  const existing = await prisma.review.findUnique({
    where: {
      productId_userId: {
        productId: product.id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    return { error: "You have already reviewed this product." };
  }

  const imageUrl = parsed.data.imageUrl?.trim() || null;

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: session.user.id,
      rating: parsed.data.rating,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body,
      imageUrl,
    },
  });

  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/products");
  return { success: true };
}

export async function deleteReviewAction(reviewId: string): Promise<ReviewActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in required." };
  }

  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId: session.user.id,
    },
    include: { product: { select: { slug: true } } },
  });

  if (!review) {
    return { error: "Review not found." };
  }

  await deleteLocalReviewImage(review.imageUrl);
  await prisma.review.delete({ where: { id: review.id } });

  revalidatePath(`/products/${review.product.slug}`);
  revalidatePath("/products");
  return { success: true };
}
