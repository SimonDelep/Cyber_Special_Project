import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/db';
import { reviews, users } from '@/db/schema';
import { deleteReviewImage, saveReviewImageFile } from '@/lib/reviews/image';
import { validateProfilePictureUrl } from '@/lib/auth/validation';
import type { ReviewDTO } from '@/lib/types';

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title: string;
  body: string;
  imageUrl?: string | null;
}

function validateReviewInput(input: CreateReviewInput): void {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }
  const title = input.title.trim();
  if (title.length < 3 || title.length > 100) {
    throw new Error('Title must be between 3 and 100 characters.');
  }
  const body = input.body.trim();
  if (body.length < 10 || body.length > 2000) {
    throw new Error('Review must be between 10 and 2000 characters.');
  }
}

function toReviewDTO(
  row: typeof reviews.$inferSelect,
  author: { displayName: string; username: string },
): ReviewDTO {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    authorName: author.displayName,
    authorUsername: author.username,
    rating: row.rating,
    title: row.title,
    body: row.body,
    image: row.image,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getReviewsForProduct(productId: string): Promise<ReviewDTO[]> {
  const db = getDb();
  const rows = await db
    .select({
      review: reviews,
      displayName: users.displayName,
      username: users.username,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

  return rows.map((r) => toReviewDTO(r.review, r));
}

export async function getUserReviewForProduct(
  productId: string,
  userId: string,
): Promise<ReviewDTO | null> {
  const db = getDb();
  const [row] = await db
    .select({
      review: reviews,
      displayName: users.displayName,
      username: users.username,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)))
    .limit(1);

  return row ? toReviewDTO(row.review, row) : null;
}

export async function createReview(input: CreateReviewInput): Promise<ReviewDTO> {
  validateReviewInput(input);
  const db = getDb();

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(eq(reviews.productId, input.productId), eq(reviews.userId, input.userId)),
    )
    .limit(1);

  if (existing) {
    throw new Error('You have already reviewed this product.');
  }

  let image: string | null = null;
  if (input.imageUrl?.trim()) {
    const err = validateProfilePictureUrl(input.imageUrl.trim());
    if (err) throw new Error(err);
    image = input.imageUrl.trim();
  }

  const now = new Date();
  const id = nanoid();

  const [row] = await db
    .insert(reviews)
    .values({
      id,
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title.trim(),
      body: input.body.trim(),
      image,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const [author] = await db
    .select({ displayName: users.displayName, username: users.username })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  return toReviewDTO(row, author ?? { displayName: 'User', username: 'user' });
}

export async function setReviewImage(
  reviewId: string,
  userId: string,
  file: File,
): Promise<ReviewDTO> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .limit(1);

  if (!row) throw new Error('Review not found.');

  if (row.image) await deleteReviewImage(row.image);
  const path = await saveReviewImageFile(reviewId, file);

  const [updated] = await db
    .update(reviews)
    .set({ image: path, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning();

  const [author] = await db
    .select({ displayName: users.displayName, username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return toReviewDTO(updated, author ?? { displayName: 'User', username: 'user' });
}

export async function deleteReview(reviewId: string, userId: string): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .limit(1);

  if (!row) throw new Error('Review not found.');

  await deleteReviewImage(row.image);
  await db.delete(reviews).where(eq(reviews.id, reviewId));
}
