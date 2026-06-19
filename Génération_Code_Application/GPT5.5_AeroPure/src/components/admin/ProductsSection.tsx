"use client";

import { useState } from "react";
import type { AdminProduct } from "@/types/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/admin/validation";

type ProductsSectionProps = {
  initialProducts: AdminProduct[];
  onNotify: (msg: string | null) => void;
};

function categoryLabel(value: string) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function ProductsSection({
  initialProducts,
  onNotify,
}: ProductsSectionProps) {
  const [products, setProducts] = useState(initialProducts);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleCreated(product: AdminProduct) {
    setProducts((prev) => [product, ...prev]);
    setShowCreate(false);
    onNotify("Product created");
  }

  function handleCsvImported(imported: AdminProduct[]) {
    setProducts((prev) => [...imported, ...prev]);
  }

  function handleUpdated(product: AdminProduct) {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? product : p)),
    );
    setEditingId(null);
    onNotify("Product updated");
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete product "${name}"?`)) return;

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Delete failed");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setEditingId(null);
    onNotify("Product deleted");
  }

  const editingProduct = products.find((p) => p.id === editingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Create and update product catalog entries.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowCreate(!showCreate);
            setEditingId(null);
          }}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          {showCreate ? "Cancel" : "Add product"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold">New product</h3>
          <div className="mt-6">
            <ProductForm onSuccess={handleCreated} />
          </div>
        </div>
      )}

      <ProductCsvImport onImported={handleCsvImported} onNotify={onNotify} />

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {p.featured && (
                    <span className="ml-2 text-xs text-accent">★</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{p.slug}</td>
                <td className="px-4 py-3">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-muted">
                  {categoryLabel(p.category)}
                </td>
                <td className="px-4 py-3">
                  {p.inStock ? (
                    <span className="text-green-600">In stock</span>
                  ) : (
                    <span className="text-muted">Out of stock</span>
                  )}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(editingId === p.id ? null : p.id);
                      setShowCreate(false);
                    }}
                    className="font-medium text-accent hover:underline"
                  >
                    {editingId === p.id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold">Edit: {editingProduct.name}</h3>
          <div className="mt-6">
            <ProductForm
              product={editingProduct}
              onSuccess={handleUpdated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
