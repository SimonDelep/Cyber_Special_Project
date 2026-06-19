export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function dollarsToCents(dollars: string): number {
  const value = parseFloat(dollars.replace(',', '.'));
  if (Number.isNaN(value)) return NaN;
  return Math.round(value * 100);
}
