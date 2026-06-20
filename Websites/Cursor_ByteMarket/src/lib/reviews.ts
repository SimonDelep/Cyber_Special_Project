import { and, avg, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { productReviews, products, users } from "@/db/schema";
import { saveReviewImageFile, validateReviewImageUrl } from "@/lib/review-image";

export type ProductReviewView = {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ProductReviewStats = {
  count: number;
  averageRating: number | null;
};

export type CreateReviewInput = {
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  body: string;
  imageUrl?: string | null;
  imageFile?: File | null;
};

export function parseRating(value: string): number | null {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return rating;
}

export async function getProductReviewStats(
  productId: number,
): Promise<ProductReviewStats> {
  const db = getDb();
  const [row] = await db
    .select({
      count: count(productReviews.id),
      averageRating: avg(productReviews.rating),
    })
    .from(productReviews)
    .where(eq(productReviews.productId, productId));

  const reviewCount = Number(row?.count ?? 0);
  const average =
    row?.averageRating != null ? Number(row.averageRating) : null;

  return {
    count: reviewCount,
    averageRating: average != null ? Math.round(average * 10) / 10 : null,
  };
}

export async function getReviewsForProduct(
  productId: number,
): Promise<ProductReviewView[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: productReviews.id,
      rating: productReviews.rating,
      title: productReviews.title,
      body: productReviews.body,
      imageUrl: productReviews.imageUrl,
      createdAt: productReviews.createdAt,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(productReviews)
    .innerJoin(users, eq(productReviews.userId, users.id))
    .where(eq(productReviews.productId, productId))
    .orderBy(desc(productReviews.createdAt));

  return rows;
}

export async function getUserReviewForProduct(
  productId: number,
  userId: number,
): Promise<{ id: number } | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: productReviews.id })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.productId, productId),
        eq(productReviews.userId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

async function resolveReviewImageUrl(
  userId: number,
  imageUrl: string,
  imageFile: File | null | undefined,
): Promise<{ url: string | null; error?: string }> {
  if (imageFile && imageFile.size > 0) {
    const saved = await saveReviewImageFile(userId, imageFile);
    if (saved.error) return { url: null, error: saved.error };
    return { url: saved.url ?? null };
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) return { url: null };

  const urlError = validateReviewImageUrl(trimmed);
  if (urlError) return { url: null, error: urlError };

  return { url: trimmed };
}

export async function createProductReview(
  input: CreateReviewInput,
): Promise<{ error?: string }> {
  const body = input.body.trim();
  if (!body) {
    return { error: "Review text is required." };
  }
  if (body.length > 5000) {
    return { error: "Review must be 5000 characters or fewer." };
  }

  const title = input.title?.trim() || null;
  if (title && title.length > 120) {
    return { error: "Title must be 120 characters or fewer." };
  }

  const existing = await getUserReviewForProduct(input.productId, input.userId);
  if (existing) {
    return { error: "You have already reviewed this product." };
  }

  const image = await resolveReviewImageUrl(
    input.userId,
    input.imageUrl ?? "",
    input.imageFile,
  );
  if (image.error) return { error: image.error };

  const db = getDb();
  const now = new Date();

  try {
    await db.insert(productReviews).values({
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title,
      body,
      imageUrl: image.url,
      createdAt: now,
      updatedAt: now,
    });
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return { error: "You have already reviewed this product." };
    }
    throw err;
  }
}

export async function getProductIdBySlug(slug: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return row?.id ?? null;
}
