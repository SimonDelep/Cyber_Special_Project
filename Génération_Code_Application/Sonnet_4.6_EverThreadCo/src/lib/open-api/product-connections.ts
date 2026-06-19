/** Maps each product to open-data topics (Wikipedia + Open Library). */
const PRODUCT_CONNECTION_MAP: Record<
  string,
  { wikipediaTitle: string; libraryQuery: string; label: string }
> = {
  "organic-crew-tee": {
    wikipediaTitle: "Organic cotton",
    libraryQuery: "organic cotton sustainable fashion",
    label: "organic cotton",
  },
  "recycled-fiber-hoodie": {
    wikipediaTitle: "Textile recycling",
    libraryQuery: "textile recycling circular fashion",
    label: "recycled fibers",
  },
  "egyptian-cotton-oxford-shirt": {
    wikipediaTitle: "Egyptian cotton",
    libraryQuery: "egyptian cotton textiles",
    label: "Egyptian cotton",
  },
  "recycled-chino-trousers": {
    wikipediaTitle: "Chino cloth",
    libraryQuery: "sustainable trousers ethical fashion",
    label: "chino & recycled blends",
  },
  "organic-rib-tank": {
    wikipediaTitle: "Tank top",
    libraryQuery: "organic cotton basics wardrobe",
    label: "organic basics",
  },
  "french-terry-sweatshirt": {
    wikipediaTitle: "French terry",
    libraryQuery: "sustainable sweatshirt cotton",
    label: "French terry",
  },
};

const DEFAULT_CONNECTION = {
  wikipediaTitle: "Sustainable fashion",
  libraryQuery: "sustainable fashion organic clothing",
  label: "sustainable fashion",
};

export function getProductConnectionConfig(slug: string) {
  return PRODUCT_CONNECTION_MAP[slug] ?? DEFAULT_CONNECTION;
}

export const CATALOG_INSIGHT_TOPIC = {
  wikipediaTitle: "Sustainable fashion",
  libraryQuery: "sustainable fashion slow fashion",
};
