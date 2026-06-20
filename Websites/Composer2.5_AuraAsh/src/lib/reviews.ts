import { prisma } from "@/lib/prisma";
import type { ReviewItem } from "@/types";

export async function getProductReviews(productId: string): Promise<ReviewItem[]> {
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
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

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    imageUrl: review.imageUrl,
    createdAt: review.createdAt.toISOString(),
    user: review.user,
  }));
}

export async function getUserReviewForProduct(
  productId: string,
  userId: string,
): Promise<ReviewItem | null> {
  const review = await prisma.review.findUnique({
    where: {
      productId_userId: { productId, userId },
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

  if (!review) return null;

  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    imageUrl: review.imageUrl,
    createdAt: review.createdAt.toISOString(),
    user: review.user,
  };
}

export function getAverageRating(reviews: ReviewItem[]): number | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
