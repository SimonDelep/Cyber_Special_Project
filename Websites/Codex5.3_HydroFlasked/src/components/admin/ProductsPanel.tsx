"use client";

import { useState } from "react";
import type { Product, ProductCategory } from "../../../generated/prisma/client";
import { formatPrice, centsToDollarInput, dollarInputToCents } from "@/lib/format";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { parseApiResponse } from "@/lib/parse-api-response";

type ProductsPanelProps = {
  initialProducts: Product[];
};

const categories: ProductCategory[] = ["TUMBLER", "GLASSWARE", "WINE_MUG"];

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  priceDollars: string;
  category: ProductCategory;
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
};

const emptyProduct: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  priceDollars: "",
  category: "TUMBLER",
  imageUrl: "",
  featured: false,
  inStock: true,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductsPanel({ initialProducts }: ProductsPanelProps) {
  const [products, setProducts] = useState(initialProducts);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setMode("create");
    setEditingProduct(null);
    setForm(emptyProduct);
    setError(null);
    setMessage(null);
  }

  function openEdit(product: Product) {
    setMode("edit");
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      priceDollars: centsToDollarInput(product.priceCents),
      category: product.category,
      imageUrl: product.imageUrl ?? "",
      featured: product.featured,
      inStock: product.inStock,
    });
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setMode("list");
    setEditingProduct(null);
    setForm(emptyProduct);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const priceCents = dollarInputToCents(form.priceDollars);
    if (priceCents === null || priceCents <= 0) {
      setError("Enter a valid price");
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      priceCents,
      category: form.category,
      imageUrl: form.imageUrl || null,
      featured: form.featured,
      inStock: form.inStock,
    };

    try {
      const url =
        mode === "edit" && editingProduct
          ? `/api/admin/products/${editingProduct.id}`
          : "/api/admin/products";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError((data.error as string) ?? "Save failed");
        return;
      }

      const product = data.product as Product;
      if (mode === "create") {
        setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
        setMessage("Product created");
      } else {
        setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
        setMessage("Product updated");
      }
      closeForm();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError((data.error as string) ?? "Delete failed");
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      setMessage("Product deleted");
      closeForm();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleCsvImported(imported: Product[]) {
    setProducts((prev) => {
      const merged = [...prev, ...imported];
      return merged.sort((a, b) => a.name.localeCompare(b.name));
    });
    setMessage(`Imported ${imported.length} product${imported.length !== 1 ? "s" : ""} from CSV`);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <ProductCsvImport onImported={handleCsvImported} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{products.length} products in catalog</p>
        {mode === "list" ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Add product
          </button>
        ) : (
          <button
            type="button"
            onClick={closeForm}
            className="text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>

      {message ? (
        <p className="rounded-lg bg-brand-500/10 px-4 py-2 text-sm text-brand-200">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      ) : null}

      {mode !== "list" ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-brand-500/30 bg-slate-900/60 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">
            {mode === "create" ? "New product" : `Edit ${editingProduct?.name}`}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-300">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: mode === "create" ? slugify(name) : f.slug,
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Slug</span>
              <input
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Price (CAD)</span>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.priceDollars}
                onChange={(e) => setForm((f) => ({ ...f, priceDollars: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Category</span>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as ProductCategory,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-300">Description</span>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-300">Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="rounded border-white/20"
              />
              Featured on homepage
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
                className="rounded border-white/20"
              />
              In stock
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {loading ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
            </button>
            {mode === "edit" && editingProduct ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDelete(editingProduct)}
                className="rounded-full border border-red-500/40 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="bg-slate-950/40">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-slate-500">{product.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{product.category}</td>
                <td className="px-4 py-3 text-white">{formatPrice(product.priceCents)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {product.featured ? (
                      <span className="rounded bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">
                        Featured
                      </span>
                    ) : null}
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        product.inStock
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {product.inStock ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
