export function formatPrice(priceCents: number, locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
  }).format(priceCents / 100);
}
