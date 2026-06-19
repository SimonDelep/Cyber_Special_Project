export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dollarsToCents(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 100);
}

export function centsToDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
