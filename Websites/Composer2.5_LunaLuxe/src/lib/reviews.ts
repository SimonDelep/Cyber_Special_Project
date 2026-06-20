import { db } from '@/db';
import { reviews, users, type Review, type ReviewWithAuthor } from '@/db/schema';
import { and, avg, count, desc, eq } from 'drizzle-orm';

export interface ProductRatingSummary {
  productId: number;
  averageRating: number;
  reviewCount: number;
}

export async function getReviewsByProductId(productId: number): Promise<ReviewWithAuthor[]> {
  const rows = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      imageUrl: reviews.imageUrl,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      authorName: users.displayName,
      authorAvatar: users.avatarUrl,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  return rows;
}

export async function getProductRatingSummary(productId: number): Promise<ProductRatingSummary> {
  const [row] = await db
    .select({
      averageRating: avg(reviews.rating),
      reviewCount: count(),
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  return {
    productId,
    averageRating: row?.averageRating ? Number(row.averageRating) : 0,
    reviewCount: row?.reviewCount ?? 0,
  };
}

export async function getAllProductRatingSummaries(): Promise<Map<number, ProductRatingSummary>> {
  const rows = await db
    .select({
      productId: reviews.productId,
      averageRating: avg(reviews.rating),
      reviewCount: count(),
    })
    .from(reviews)
    .groupBy(reviews.productId);

  const map = new Map<number, ProductRatingSummary>();
  for (const row of rows) {
    map.set(row.productId, {
      productId: row.productId,
      averageRating: row.averageRating ? Number(row.averageRating) : 0,
      reviewCount: row.reviewCount,
    });
  }
  return map;
}

export async function getUserReviewForProduct(
  userId: number,
  productId: number
): Promise<Review | undefined> {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1);
  return review;
}

export async function upsertReview(data: {
  productId: number;
  userId: number;
  rating: number;
  title: string;
  content: string;
  imageUrl?: string | null;
}): Promise<Review> {
  const now = new Date().toISOString();
  const existing = await getUserReviewForProduct(data.userId, data.productId);

  if (existing) {
    const [review] = await db
      .update(reviews)
      .set({
        rating: data.rating,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
        updatedAt: now,
      })
      .where(eq(reviews.id, existing.id))
      .returning();
    return review;
  }

  const [review] = await db
    .insert(reviews)
    .values({
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return review;
}
