export interface Product {
  id: number;
  name: string;
  description: string;
  category: "keyboard" | "mouse" | "desk_mat" | string;
  price_cents: number;
  image_url: string | null;
}
