type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, max = 5, size = "sm" }: StarRatingProps) {
  const textSize = size === "md" ? "text-lg" : "text-sm";

  return (
    <span
      className={`inline-flex gap-0.5 ${textSize}`}
      aria-label={`${rating.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={i < Math.round(rating) ? "text-amber-600" : "text-espresso/25"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}
