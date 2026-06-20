import { getSqlite } from './client';
import type { ReviewWithAuthor } from './schema';

type ReviewRow = {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author_display_name: string;
  author_username: string;
  author_avatar_url: string | null;
};

const SELECT_WITH_AUTHOR = `
  r.id, r.product_id, r.user_id, r.rating, r.body, r.image_url, r.created_at, r.updated_at,
  u.display_name AS author_display_name,
  u.username AS author_username,
  u.avatar_url AS author_avatar_url
`;

function mapRow(row: ReviewRow): ReviewWithAuthor {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorDisplayName: row.author_display_name,
    authorUsername: row.author_username,
    authorAvatarUrl: row.author_avatar_url,
  };
}

export function listReviewsByProductId(productId: number): ReviewWithAuthor[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT ${SELECT_WITH_AUTHOR}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
    )
    .all(productId) as ReviewRow[];
  return rows.map(mapRow);
}

export function findReviewByUserAndProduct(
  userId: number,
  productId: number,
): ReviewWithAuthor | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT ${SELECT_WITH_AUTHOR}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = ? AND r.product_id = ?`,
    )
    .get(userId, productId) as ReviewRow | undefined;
  return row ? mapRow(row) : null;
}

export function getProductReviewSummary(productId: number): {
  count: number;
  averageRating: number;
} {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count, AVG(rating) AS average_rating
       FROM reviews WHERE product_id = ?`,
    )
    .get(productId) as { count: number; average_rating: number | null };

  return {
    count: row.count,
    averageRating: row.average_rating ? Math.round(row.average_rating * 10) / 10 : 0,
  };
}

export function upsertReview(input: {
  productId: number;
  userId: number;
  rating: number;
  body: string;
  imageUrl?: string | null;
}): ReviewWithAuthor {
  const db = getSqlite();
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT id, image_url FROM reviews WHERE user_id = ? AND product_id = ?')
    .get(input.userId, input.productId) as
    | { id: number; image_url: string | null }
    | undefined;

  if (existing) {
    db.prepare(
      `UPDATE reviews SET rating = ?, body = ?, image_url = ?, updated_at = ? WHERE id = ?`,
    ).run(
      input.rating,
      input.body,
      input.imageUrl !== undefined ? input.imageUrl : existing.image_url,
      now,
      existing.id,
    );
  } else {
    db.prepare(
      `INSERT INTO reviews (product_id, user_id, rating, body, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.productId,
      input.userId,
      input.rating,
      input.body,
      input.imageUrl ?? null,
      now,
      now,
    );
  }

  const review = findReviewByUserAndProduct(input.userId, input.productId);
  if (!review) throw new Error('Failed to save review');
  return review;
}

export function deleteReviewByUserAndProduct(
  userId: number,
  productId: number,
): boolean {
  const db = getSqlite();
  const result = db
    .prepare('DELETE FROM reviews WHERE user_id = ? AND product_id = ?')
    .run(userId, productId);
  return result.changes > 0;
}
