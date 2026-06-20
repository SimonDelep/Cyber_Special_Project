import type { Product } from "./product";

export interface ProductImportResult {
  created_count: number;
  error_count: number;
  errors: string[];
  products: Product[];
}
