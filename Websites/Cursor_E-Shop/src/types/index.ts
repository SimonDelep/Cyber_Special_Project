export type ProductCategory =
  | "phones"
  | "laptops"
  | "audio"
  | "accessories";

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: ProductCategory;
  imageUrl?: string | null;
}
