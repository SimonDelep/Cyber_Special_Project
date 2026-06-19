import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/forms/ProductForm";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { createProductAction } from "@/actions/admin/products";

export default async function AdminNewProductPage() {
  await requireAdmin();

  return (
    <div className="max-w-lg">
      <Link
        href="/admin/products"
        className="text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Back to products
      </Link>
      <h2 className="mt-4 text-xl font-semibold">New product</h2>
      <div className="mt-8 space-y-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <ProductForm
            action={createProductAction}
            submitLabel="Create product"
            autoSlug
          />
        </div>
        <ProductCsvImport />
      </div>
    </div>
  );
}
