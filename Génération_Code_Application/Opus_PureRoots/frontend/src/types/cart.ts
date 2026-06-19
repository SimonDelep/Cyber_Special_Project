import type { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutResult {
  order_id: number;
  total: string;
  new_balance: string;
  items: {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
  message: string;
}
