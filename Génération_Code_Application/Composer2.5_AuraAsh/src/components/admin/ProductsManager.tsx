"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatPrice, slugify } from "@/lib/utils";
import type { AdminProduct } from "@/types/admin";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: "CANDLES" as AdminProduct["category"],
  imageUrl: "",
  inStock: true,
  featured: false,
};

const categoryOptions = [
  { value: "CANDLES", label: "Candles" },
  { value: "INCENSE_HOLDERS", label: "Incense Holders" },
  { value: "DIFFUSERS", label: "Diffusers" },
];

export function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setCreating(false);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl ?? "",
      inStock: product.inStock,
      featured: product.featured,
    });
    setMessage("");
    setError("");
  }

  function closeForm() {
    setEditing(null);
    setCreating(false);
    setMessage("");
    setError("");
  }

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && (creating || !prev.slug)) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError("Enter a valid price greater than 0");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description,
      price,
      category: form.category,
      imageUrl: form.imageUrl || undefined,
      inStock: form.inStock,
      featured: form.featured,
    };

    try {
      const url = editing
        ? `/api/admin/products/${editing.id}`
        : "/api/admin/products";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save product");

      setMessage(editing ? "Product updated." : "Product created.");
      closeForm();
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: AdminProduct) {
    if (!confirm(`Delete product "${product.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete product");

      if (editing?.id === product.id) closeForm();
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  if (loading) {
    return <p className="text-sm text-stone">Loading products...</p>;
  }

  return (
    <div className="space-y-6">
      <ProductCsvImport onImported={fetchProducts} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-stone">{products.length} products</p>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      {error && !editing && !creating && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-stone/15">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone/15 bg-cream">
            <tr>
              <th className="px-4 py-3 font-medium text-charcoal">Name</th>
              <th className="px-4 py-3 font-medium text-charcoal">Category</th>
              <th className="px-4 py-3 font-medium text-charcoal">Price</th>
              <th className="px-4 py-3 font-medium text-charcoal">Stock</th>
              <th className="px-4 py-3 font-medium text-charcoal">Featured</th>
              <th className="px-4 py-3 font-medium text-charcoal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-stone/10 last:border-0">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-stone">
                  {product.category.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  {product.inStock ? (
                    <span className="text-sage">In stock</span>
                  ) : (
                    <span className="text-stone">Out of stock</span>
                  )}
                </td>
                <td className="px-4 py-3">{product.featured ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="text-ember hover:text-ember-dark"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <div className="rounded-2xl border border-stone/15 bg-warm-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-charcoal">
              {editing ? `Edit Product: ${editing.name}` : "New Product"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-stone hover:text-charcoal"
            >
              Close
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => updateForm("slug", e.target.value)}
            />
            <Input
              label="Price (CAD)"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
              required
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) =>
                updateForm("category", e.target.value as AdminProduct["category"])
              }
              options={categoryOptions}
            />
            <div className="sm:col-span-2">
              <Input
                label="Image URL (optional)"
                type="url"
                value={form.imageUrl}
                onChange={(e) => updateForm("imageUrl", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                rows={4}
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => updateForm("inStock", e.target.checked)}
                className="rounded border-stone/30"
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateForm("featured", e.target.checked)}
                className="rounded border-stone/30"
              />
              Featured product
            </label>
          </div>

          <Button className="mt-6" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
          </Button>
        </div>
      )}
    </div>
  );
}
