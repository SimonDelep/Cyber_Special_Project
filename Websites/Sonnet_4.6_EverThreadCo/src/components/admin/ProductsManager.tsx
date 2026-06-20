"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { centsToDollarsInput, dollarsToCents, slugify } from "@/lib/admin/utils";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  featured: boolean;
  inStock: boolean;
  categoryId: string;
  category: { id: string; name: string; slug?: string };
};

type ProductsManagerProps = {
  products: AdminProductRow[];
  categories: AdminCategory[];
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  imageUrl: "",
  featured: false,
  inStock: true,
  categoryId: "",
};

export function ProductsManager({
  products: initialProducts,
  categories,
}: ProductsManagerProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugManual, setSlugManual] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setSlugManual(false);
    setEditId(null);
    setMode("list");
    setMessage(null);
    setError(null);
  }

  function startCreate() {
    resetForm();
    setMode("create");
  }

  function startEdit(product: AdminProductRow) {
    setEditId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: centsToDollarsInput(product.priceCents),
      imageUrl: product.imageUrl ?? "",
      featured: product.featured,
      inStock: product.inStock,
      categoryId: product.categoryId,
    });
    setSlugManual(true);
    setMode("edit");
    setMessage(null);
    setError(null);
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugManual && mode === "create") {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const priceCents = dollarsToCents(form.price);
    if (priceCents === null) {
      setLoading(false);
      setError("Invalid price");
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      priceCents,
      imageUrl: form.imageUrl || null,
      featured: form.featured,
      inStock: form.inStock,
      categoryId: form.categoryId,
    };

    const url =
      mode === "edit" && editId
        ? `/api/admin/products/${editId}`
        : "/api/admin/products";
    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    if (mode === "create") {
      setProducts((prev) => [data.product, ...prev]);
      setMessage("Product created");
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === editId ? data.product : p)),
      );
      setMessage("Product updated");
    }

    resetForm();
    router.refresh();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Delete failed");
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editId === id) resetForm();
    setMessage("Product deleted");
    router.refresh();
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-sand-900">
            {mode === "create" ? "New product" : "Edit product"}
          </h2>
          <Button type="button" variant="ghost" onClick={resetForm}>
            Cancel
          </Button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-sand-200 bg-cream-50 p-6"
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              updateField("slug", e.target.value);
            }}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
          />
          <Input
            label="Price (CAD)"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
          />
          <Input
            label="Image URL (optional)"
            type="url"
            value={form.imageUrl}
            onChange={(e) => updateField("imageUrl", e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoryId" className="text-sm font-medium text-sand-800">
              Category
            </label>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              required
              className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-sand-800">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-sand-800">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => updateField("inStock", e.target.checked)}
            />
            In stock
          </label>
          <Button type="submit" disabled={loading}>
            {mode === "create" ? "Create product" : "Save changes"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl text-sand-900">Products</h2>
          <p className="mt-1 text-sm text-sand-600">
            {products.length} product{products.length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <Button type="button" onClick={startCreate}>
          Add product
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <ProductCsvImport
          categories={categories}
          onImported={(imported) => {
            setProducts((prev) => [...imported, ...prev]);
            setMessage(
              `Imported ${imported.length} product${imported.length === 1 ? "" : "s"} from CSV`,
            );
            setError(null);
          }}
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-sand-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-100 text-sand-600">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-sand-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-sand-900">{product.name}</p>
                  <p className="text-xs text-sand-500">{product.slug}</p>
                </td>
                <td className="px-4 py-3 text-sand-700">{product.category.name}</td>
                <td className="px-4 py-3 text-sand-700">
                  {formatPrice(product.priceCents)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sand-700">
                    {product.inStock ? "In stock" : "Out of stock"}
                    {product.featured ? " · Featured" : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="text-sage-700 hover:text-sage-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteProduct(product.id)}
                      className="text-red-700 hover:text-red-900"
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
    </div>
  );
}
