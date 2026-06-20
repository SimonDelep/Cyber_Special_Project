const accentBySlug: Record<string, string> = {
  "organic-crew-tee": "from-sage-100 via-cream-100 to-sand-200",
  "recycled-fiber-hoodie": "from-sand-200 via-sage-50 to-sand-100",
  "egyptian-cotton-oxford-shirt": "from-cream-100 via-sand-100 to-sage-100",
  "recycled-chino-trousers": "from-sand-100 via-cream-50 to-sage-50",
  "organic-rib-tank": "from-sage-50 via-cream-100 to-sand-100",
  "french-terry-sweatshirt": "from-sand-200 via-cream-100 to-sage-100",
};

export function productAccent(slug: string): string {
  return accentBySlug[slug] ?? "from-sand-100 via-cream-100 to-sage-50";
}
