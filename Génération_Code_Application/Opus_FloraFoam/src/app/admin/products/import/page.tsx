import Link from "next/link";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";

export const metadata = {
  title: "Admin — Import products | FloraFoam",
};

export default function AdminProductsImportPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm font-medium text-sage-600 hover:text-sage-900"
        >
          ← Products
        </Link>
        <h2 className="mt-2 font-display text-2xl font-semibold text-sage-900">
          Bulk import
        </h2>
        <p className="text-sm text-sage-600">Create catalog items from a CSV file.</p>
      </div>

      <ProductCsvImport />
    </div>
  );
}
