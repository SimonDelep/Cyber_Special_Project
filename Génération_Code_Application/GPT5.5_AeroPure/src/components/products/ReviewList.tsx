"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
};

type ReviewListProps = {
  reviews: ReviewItem[];
  currentUserId?: string;
};

export function ReviewList({ reviews, currentUserId }: ReviewListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(reviewId: string) {
    if (!confirm("Delete your review?")) return;
    setDeletingId(reviewId);
    await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    router.refresh();
    setDeletingId(null);
  }

  if (reviews.length === 0) {
    return (
      <p className="text-center text-muted py-8">No reviews yet. Be the first!</p>
    );
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-border bg-surface p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-border/50 text-sm font-semibold">
                {review.user.profilePicture ? (
                  <Image
                    src={review.user.profilePicture}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  review.user.username[0]?.toUpperCase()
                )}
              </div>
              <div>
                <p className="font-medium">{review.user.username}</p>
                <p className="text-sm text-muted">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {currentUserId === review.user.id && (
              <button
                type="button"
                onClick={() => handleDelete(review.id)}
                disabled={deletingId === review.id}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {deletingId === review.id ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
          {review.title && (
            <h4 className="mt-3 font-semibold">{review.title}</h4>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted">{review.content}</p>
          {review.imageUrl && (
            <div className="relative mt-4 h-48 w-full max-w-md overflow-hidden rounded-xl">
              <Image
                src={review.imageUrl}
                alt="Review"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
