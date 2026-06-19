import Image from "next/image";
import { StarRating } from "@/components/reviews/StarRating";
import { UserAvatar } from "@/components/profile/UserAvatar";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    username: string;
    name: string | null;
    profileImageUrl: string | null;
  };
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-sage-200 bg-cream-50/50 p-8 text-center text-sage-600">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => {
        const displayName = review.user.name ?? review.user.username;
        return (
          <li
            key={review.id}
            className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6"
          >
            <div className="flex items-start gap-4">
              <UserAvatar
                name={displayName}
                imageUrl={review.user.profileImageUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-sage-900">{displayName}</p>
                  <span className="text-xs text-sage-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1">
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.title && (
                  <p className="mt-2 font-display text-lg font-semibold text-sage-900">
                    {review.title}
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-sage-700">{review.body}</p>
                {review.imageUrl && (
                  <div className="relative mt-4 aspect-video max-w-md overflow-hidden rounded-xl bg-sage-100">
                    <Image
                      src={review.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
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
