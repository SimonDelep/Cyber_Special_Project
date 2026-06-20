export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  username: string;
  rating: number;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewInput {
  rating: number;
  title: string;
  body: string;
  image_url?: string | null;
}
