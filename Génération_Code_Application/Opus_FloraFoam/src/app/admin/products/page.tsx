import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";

export const metadata = {
  title: "Admin — Products | FloraFoam",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-sage-900">Products</h2>
          <p className="text-sm text-sage-600">{products.length} catalog items</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900"
          >
            Add product
          </Link>
          <Link
            href="/admin/products/import"
            className="inline-flex rounded-full border border-sage-300 px-5 py-2.5 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            Import CSV
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-sage-200/80">
        <table className="min-w-full divide-y divide-sage-200 text-sm">
          <thead className="bg-sage-50/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Name</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Category</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Price</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-sage-700">Featured</th>
              <th className="px-4 py-3 text-right font-medium text-sage-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage-100 bg-cream-50">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-sage-900">{product.name}</p>
                  <p className="text-xs text-sage-500">{product.slug}</p>
                </td>
                <td className="px-4 py-3 text-sage-700">
                  {CATEGORY_LABELS[product.category]}
                </td>
                <td className="px-4 py-3 text-sage-700">{formatPrice(product.priceCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.inStock
                        ? "bg-green-100 text-green-800"
                        : "bg-sage-100 text-sage-600"
                    }`}
                  >
                    {product.inStock ? "In stock" : "Out of stock"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sage-600">{product.featured ? "Yes" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-sage-800 hover:text-sage-900"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
