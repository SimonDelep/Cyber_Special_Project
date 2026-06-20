export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  username: string;
  rating: number;
  comment: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
