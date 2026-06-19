import Image from "next/image";
import { StarRating } from "@/components/ui/StarRating";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

type ReviewListProps = {
  reviews: ReviewItem[];
};

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-sand-300 bg-cream-50 p-8 text-center text-sm text-sand-600">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-sand-200 bg-cream-50 p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-sand-900">
                {review.user.displayName ?? `@${review.user.username}`}
              </p>
              <p className="text-xs text-sand-500">
                {new Date(review.createdAt).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <StarRating rating={review.rating} size="md" />
          </div>

          {review.title ? (
            <h4 className="mt-3 font-display text-lg text-sand-900">
              {review.title}
            </h4>
          ) : null}

          <p className="mt-2 text-sm leading-relaxed text-sand-700">
            {review.body}
          </p>

          {review.imageUrl ? (
            <div className="relative mt-4 aspect-video max-w-md overflow-hidden rounded-xl">
              <Image
                src={review.imageUrl}
                alt="Review"
                fill
                className="object-cover"
                unoptimized={review.imageUrl.startsWith("/uploads/")}
              />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
