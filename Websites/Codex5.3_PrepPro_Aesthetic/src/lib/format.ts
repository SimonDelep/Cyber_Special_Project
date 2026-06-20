export function formatPrice(cents: number, locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}
