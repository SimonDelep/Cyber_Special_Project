export type PublicReview = {
  id: number;
  productId: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rating: number;
  title: string | null;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl: string | null;
  inStock: boolean;
  createdAt: string;
  reviewCount: number;
  averageRating: number | null;
};
