export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  created_at: string;
  review_count?: number;
  average_rating?: number | null;
}

export type ProductSort =
  | "name"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "rating";

export interface ProductSearchParams {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: ProductSort;
}

export interface ProductInput {
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url?: string | null;
}
