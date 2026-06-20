export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export const initialCartState: CartState = {
  items: [],
  isOpen: false,
};

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
