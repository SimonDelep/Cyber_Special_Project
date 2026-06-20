export interface ReviewAuthor {
  id: number;
  username: string;
  first_name: string | null;
}

export interface Review {
  id: number;
  product_id: number;
  rating: number;
  title: string | null;
  body: string;
  image_url: string | null;
  author: ReviewAuthor;
  created_at: string;
  updated_at: string;
}

export interface ReviewCreatePayload {
  rating: number;
  title?: string | null;
  body: string;
  image_url?: string | null;
}
