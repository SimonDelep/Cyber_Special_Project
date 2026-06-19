export function getReviewStats(ratings: number[]) {
  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

export function formatReviewAverage(average: number, count: number): string {
  if (count === 0) {
    return "No reviews yet";
  }
  return `${average.toFixed(1)} · ${count} review${count === 1 ? "" : "s"}`;
}
