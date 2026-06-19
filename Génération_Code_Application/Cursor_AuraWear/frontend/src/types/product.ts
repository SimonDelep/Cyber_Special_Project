export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreatePayload {
  name: string;
  description?: string | null;
  price: string;
  stock: number;
  category: string;
  image_url?: string | null;
  is_active?: boolean;
}

export type ProductSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export interface ProductFilters {
  q?: string;
  category?: string;
  min_price?: string;
  max_price?: string;
  sort?: ProductSort;
}

export interface ProductUpdatePayload {
  name?: string;
  description?: string | null;
  price?: string;
  stock?: number;
  category?: string;
  image_url?: string | null;
  is_active?: boolean;
}

export interface ProductImportRowError {
  row: number;
  message: string;
}

export interface ProductImportResponse {
  created: number;
  failed: number;
  errors: ProductImportRowError[];
}
