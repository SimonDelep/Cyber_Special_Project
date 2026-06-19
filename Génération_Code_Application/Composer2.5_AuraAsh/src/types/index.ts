export type ProductCategory = "CANDLES" | "INCENSE_HOLDERS" | "DIFFUSERS";

export interface CategoryCard {
  title: string;
  description: string;
  href: string;
  accent: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  quantity: number;
}

export type CatalogSort = "featured" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

export interface CatalogFilters {
  search: string;
  category: ProductCategory | "ALL";
  stock: "all" | "in-stock" | "out-of-stock";
  sort: CatalogSort;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
}

export interface InspirationQuote {
  content: string;
  author: string;
  source: string;
}
