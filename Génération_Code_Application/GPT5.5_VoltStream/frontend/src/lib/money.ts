export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function dollarsToCents(dollars: string): number {
  const value = parseFloat(dollars);
  if (Number.isNaN(value) || value < 0) return 0;
  return Math.round(value * 100);
}
