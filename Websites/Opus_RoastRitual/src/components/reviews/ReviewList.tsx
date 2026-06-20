import Image from "next/image";

import { StarRating } from "@/components/reviews/StarRating";
import type { ReviewData } from "@/lib/products";

type ReviewListProps = {
  reviews: ReviewData[];
};

function formatReviewDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-espresso/60">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => {
        const displayName = review.user.name ?? review.user.username;
        const avatarSrc =
          review.user.image ??
          `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(review.user.username)}`;

        return (
          <li
            key={review.id}
            className="rounded-2xl border border-sage/25 bg-cream/60 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-linen">
                <Image
                  src={avatarSrc}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={
                    avatarSrc.startsWith("/uploads/") ||
                    avatarSrc.startsWith("http")
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-espresso">{displayName}</span>
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-espresso/50">
                    {formatReviewDate(review.createdAt)}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-2 font-display text-lg text-espresso">
                    {review.title}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-espresso/80">
                  {review.body}
                </p>
                {review.imageUrl && (
                  <div className="relative mt-4 h-48 w-full max-w-md overflow-hidden rounded-xl">
                    <Image
                      src={review.imageUrl}
                      alt="Review photo"
                      fill
                      className="object-cover"
                      unoptimized={review.imageUrl.startsWith("/uploads/")}
                      sizes="400px"
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
