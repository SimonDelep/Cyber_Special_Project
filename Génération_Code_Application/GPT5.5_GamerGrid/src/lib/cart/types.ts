export interface CartItem {
  id: string;
  name: string;
  price: number;
}

export interface CartSnapshot {
  items: CartItem[];
  count: number;
  total: number;
}
