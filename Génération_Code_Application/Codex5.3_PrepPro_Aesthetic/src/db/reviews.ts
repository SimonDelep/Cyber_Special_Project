import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./client";
import { reviews, users, type Review } from "./schema";

export type ReviewWithAuthor = Review & {
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
};

export function listReviewsByProductId(productId: number): ReviewWithAuthor[] {
  const db = getDb();
  const rows = db
    .select({
      review: reviews,
      authorDisplayName: users.displayName,
      authorUsername: users.username,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .all();

  return rows.map((r) => ({
    ...r.review,
    authorDisplayName: r.authorDisplayName,
    authorUsername: r.authorUsername,
    authorAvatarUrl: r.authorAvatarUrl,
  }));
}

export function findReviewByUserAndProduct(
  userId: number,
  productId: number,
): Review | undefined {
  const db = getDb();
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .limit(1)
    .all()[0];
}

export function createReview(data: {
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  imageUrl?: string | null;
}): Review {
  const db = getDb();
  const inserted = db
    .insert(reviews)
    .values({
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      comment: data.comment.trim(),
      imageUrl: data.imageUrl ?? null,
    })
    .returning()
    .all();
  return inserted[0]!;
}

export function getAverageRating(productId: number): {
  average: number;
  count: number;
} {
  const db = getDb();
  const row = db
    .select({
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .all()[0];

  return {
    average: row ? Number(row.avg) : 0,
    count: row ? Number(row.count) : 0,
  };
}
