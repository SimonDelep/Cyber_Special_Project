import Image from "next/image";
import { UserAvatar } from "@/components/auth/UserAvatar";
import type { PublicReview } from "@/lib/reviews/serializers";

type ReviewListProps = {
  reviews: PublicReview[];
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "opacity-100" : "opacity-25"}>
          ★
        </span>
      ))}
    </span>
  );
}

function isLocalUpload(url: string) {
  return url.startsWith("/uploads/");
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-slate-500">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-2xl border border-white/10 bg-slate-900/50 p-6"
        >
          <div className="flex items-start gap-4">
            <UserAvatar
              src={review.author.profileImageUrl}
              alt={review.author.displayName || review.author.username}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-white">
                  {review.author.displayName || review.author.username}
                </span>
                <StarRating rating={review.rating} />
              </div>
              {review.title ? (
                <h3 className="mt-2 font-semibold text-slate-200">{review.title}</h3>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                {review.content}
              </p>
              {review.imageUrl ? (
                <div className="relative mt-4 h-48 w-full max-w-md overflow-hidden rounded-xl border border-white/10">
                  <Image
                    src={review.imageUrl}
                    alt="Review photo"
                    fill
                    className="object-cover"
                    unoptimized={isLocalUpload(review.imageUrl)}
                  />
                </div>
              ) : null}
              <p className="mt-3 text-xs text-slate-500">
                {new Date(review.createdAt).toLocaleDateString("en-CA", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
