type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, max = 5, size = "md" }: StarRatingProps) {
  const starClass = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div
      className={`flex gap-0.5 text-amber-500 ${starClass}`}
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden>
          {i < Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

type StarRatingInputProps = {
  name: string;
  defaultValue?: number;
  error?: string;
};

export function StarRatingInput({ name, defaultValue = 5, error }: StarRatingInputProps) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-sage-800">Rating</span>
      <div className="flex flex-wrap gap-3">
        {[5, 4, 3, 2, 1].map((value) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-sage-200 px-3 py-2 text-sm has-[:checked]:border-sage-600 has-[:checked]:bg-sage-50"
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={defaultValue === value}
              className="text-sage-700 focus:ring-sage-500"
            />
            <span className="text-amber-500">{"★".repeat(value)}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
