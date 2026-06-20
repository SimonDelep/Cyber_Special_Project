export interface ProductDTO {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  badge: string | null;
  featured: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface ReviewDTO {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  rating: number;
  title: string;
  body: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
}
