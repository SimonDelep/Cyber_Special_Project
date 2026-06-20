import type { Product } from "./product";

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

export function productToCartItem(product: Product, quantity = 1): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url,
    quantity,
  };
}

export interface CheckoutResult {
  message: string;
  order_id: number;
  invoice_number: string;
  total_charged: number;
  balance: number;
  items: {
    product_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}
