export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartProductLine = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  inStock: boolean;
  lineTotal: number;
};

export type ResolvedCart = {
  items: CartProductLine[];
  subtotal: number;
  itemCount: number;
};
