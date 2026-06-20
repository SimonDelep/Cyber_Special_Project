import { StarRating } from "@/components/reviews/StarRating";

export type ReviewWithUser = {
  id: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  createdAt: Date;
  user: { name: string };
};

interface ReviewListProps {
  reviews: ReviewWithUser[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No reviews yet. Be the first to share your opinion.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-zinc-100">{review.user.name}</p>
              <p className="text-xs text-zinc-600">
                {review.createdAt.toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          {review.imageUrl ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.imageUrl}
                alt={`Photo from ${review.user.name}`}
                className="max-h-56 w-full object-cover"
              />
            </div>
          ) : null}
          {review.comment ? (
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{review.comment}</p>
          ) : (
            <p className="mt-3 text-sm italic text-zinc-600">No written comment.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
