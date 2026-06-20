export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartLine = CartItem & {
  name: string;
  slug: string;
  priceCents: number;
  inStock: boolean;
};
