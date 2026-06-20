import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "New Product | Admin | FloraFoam",
};

export default function AdminNewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        ← All products
      </Link>
      <h2 className="mt-4 font-display text-2xl font-semibold text-sage-900">New product</h2>
      <p className="mt-1 text-sm text-sage-600">Add an item to the FloraFoam catalog.</p>
      <div className="mt-8">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
