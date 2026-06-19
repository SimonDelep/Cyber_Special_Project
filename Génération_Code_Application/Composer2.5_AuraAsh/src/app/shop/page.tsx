import type { Metadata } from "next";
import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
};

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <ProductCatalog
      products={products}
      title="All products"
      subtitle="Browse the full AuraAsh catalog with search and filters."
      showHeader
    />
  );
}
