import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '@/db';
import { reviews, users } from '@/db/schema';
import type { PublicReview } from '@/types/review';

export function getReviewsForProduct(productId: number): PublicReview[] {
  const db = getDb();

  const rows = db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      imageUrl: reviews.imageUrl,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .all();

  return rows;
}

export function getUserReviewForProduct(
  productId: number,
  userId: number,
): PublicReview | null {
  const db = getDb();
  const row = db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      userId: reviews.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      imageUrl: reviews.imageUrl,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
    .get();

  return row ?? null;
}
