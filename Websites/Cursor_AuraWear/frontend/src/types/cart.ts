export interface CartItem {
  productId: number;
  name: string;
  price: string;
  image_url: string | null;
  stock: number;
  quantity: number;
}
