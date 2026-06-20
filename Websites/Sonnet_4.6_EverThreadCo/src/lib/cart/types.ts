export type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  priceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  lineTotalCents: number;
};

export type CartSummary = {
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
};

export function buildCartSummary(
  rows: {
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      priceCents: number;
      imageUrl: string | null;
      inStock: boolean;
    };
  }[],
): CartSummary {
  const items: CartLine[] = rows.map((row) => ({
    id: row.id,
    productId: row.product.id,
    quantity: row.quantity,
    name: row.product.name,
    slug: row.product.slug,
    priceCents: row.product.priceCents,
    imageUrl: row.product.imageUrl,
    inStock: row.product.inStock,
    lineTotalCents: row.product.priceCents * row.quantity,
  }));

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents: items.reduce((sum, i) => sum + i.lineTotalCents, 0),
  };
}
