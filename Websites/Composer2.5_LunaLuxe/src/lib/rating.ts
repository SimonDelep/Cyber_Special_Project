export function formatRating(value: number): string {
  return value > 0 ? value.toFixed(1) : '0.0';
}

export function renderStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
