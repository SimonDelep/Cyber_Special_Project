export function formatAverageRating(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

export function starsForRating(rating: number): string {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return "★".repeat(full) + "☆".repeat(5 - full);
}
