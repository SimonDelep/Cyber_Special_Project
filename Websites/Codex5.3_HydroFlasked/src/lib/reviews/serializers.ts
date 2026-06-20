import type { Review, User } from "../../../generated/prisma/client";

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
};

type ReviewWithUser = Review & { user: User };

export function toPublicReview(review: ReviewWithUser): PublicReview {
  const { passwordHash: _, ...author } = review.user;
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    content: review.content,
    imageUrl: review.imageUrl,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    author: {
      id: author.id,
      username: author.username,
      displayName: author.displayName,
      profileImageUrl: author.profileImageUrl,
    },
  };
}

export function toPublicReviews(reviews: ReviewWithUser[]): PublicReview[] {
  return reviews.map(toPublicReview);
}
