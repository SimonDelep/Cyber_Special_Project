"use client";

import { useCallback, useEffect, useState } from "react";

import { ProductCsvImport } from "@/components/admin/ProductCsvImport";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { formatCents, slugify } from "@/lib/format";
import type { ProductCategory } from "@/generated/prisma/enums";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceCents: number;
  imageUrl: string | null;
  origin: string | null;
  roastLevel: string | null;
  isEthical: boolean;
  isActive: boolean;
};

const emptyForm = {
  slug: "",
  name: "",
  description: "",
  category: "COFFEE" as ProductCategory,
  priceDollars: "",
  imageUrl: "",
  origin: "",
  roastLevel: "",
  isEthical: true,
  isActive: true,
};

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (res.ok) setProducts(data.products);
  }, []);

  useEffect(() => {
    loadProducts().finally(() => setLoading(false));
  }, [loadProducts]);

  function selectProduct(product: Product) {
    setSelectedId(product.id);
    setSlugTouched(true);
    setForm({
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      priceDollars: (product.priceCents / 100).toFixed(2),
      imageUrl: product.imageUrl ?? "",
      origin: product.origin ?? "",
      roastLevel: product.roastLevel ?? "",
      isEthical: product.isEthical,
      isActive: product.isActive,
    });
    setMessage(null);
  }

  function startNew() {
    setSelectedId("new");
    setSlugTouched(false);
    setForm(emptyForm);
    setMessage(null);
  }

  function buildPayload() {
    const price = parseFloat(form.priceDollars);
    if (Number.isNaN(price) || price < 0) {
      throw new Error("Invalid price");
    }
    return {
      slug: form.slug || slugify(form.name),
      name: form.name,
      description: form.description,
      category: form.category,
      priceCents: Math.round(price * 100),
      imageUrl: form.imageUrl || null,
      origin: form.origin || null,
      roastLevel: form.roastLevel || null,
      isEthical: form.isEthical,
      isActive: form.isActive,
    };
  }

  async function saveProduct() {
    setMessage(null);
    let payload;
    try {
      payload = buildPayload();
    } catch {
      setMessage({ type: "error", text: "Enter a valid price" });
      return;
    }

    const isNew = selectedId === "new";
    const url = isNew
      ? "/api/admin/products"
      : `/api/admin/products/${selectedId}`;
    const method = isNew ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Save failed" });
      return;
    }

    setMessage({
      type: "success",
      text: isNew ? "Product created" : "Product updated",
    });
    await loadProducts();
    if (isNew && data.product) {
      selectProduct(data.product);
    }
  }

  async function deleteProduct() {
    if (!selectedId || selectedId === "new") return;
    if (!window.confirm("Delete this product?")) return;

    const res = await fetch(`/api/admin/products/${selectedId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Delete failed" });
      return;
    }
    setSelectedId(null);
    setMessage({ type: "success", text: "Product deleted" });
    await loadProducts();
  }

  if (loading) {
    return <p className="text-sm text-espresso/60">Loading products…</p>;
  }

  return (
    <div className="space-y-8">
      <ProductCsvImport onImported={loadProducts} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-espresso">
            Products ({products.length})
          </h2>
          <Button type="button" variant="secondary" onClick={startNew}>
            + New
          </Button>
        </div>
        <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => selectProduct(product)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selectedId === product.id
                    ? "border-espresso bg-espresso/5"
                    : "border-sage/25 bg-cream/50 hover:border-sage"
                }`}
              >
                <span className="font-medium">{product.name}</span>
                <span className="ml-2 text-xs text-espresso/50">
                  {product.category}
                </span>
                <p className="mt-1 text-xs text-espresso/60">
                  {formatCents(product.priceCents)}
                  {!product.isActive && " · Inactive"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-sage/25 bg-cream/60 p-6">
        {!selectedId ? (
          <p className="text-sm text-espresso/60">
            Select a product to edit or click New to create one.
          </p>
        ) : (
          <div className="space-y-4">
            {message && (
              <Alert variant={message.type === "error" ? "error" : "success"}>
                {message.text}
              </Alert>
            )}

            <p className="text-sm font-medium text-espresso">
              {selectedId === "new" ? "New product" : "Edit product"}
            </p>

            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: slugTouched ? f.slug : slugify(name),
                  }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-slug">Slug</Label>
              <Input
                id="product-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-desc">Description</Label>
              <textarea
                id="product-desc"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <select
                  id="product-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                  className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm"
                >
                  <option value="COFFEE">Coffee</option>
                  <option value="TEA">Tea</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price (USD)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.priceDollars}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceDollars: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-image">Image URL</Label>
              <Input
                id="product-image"
                type="url"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imageUrl: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-origin">Origin</Label>
                <Input
                  id="product-origin"
                  value={form.origin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, origin: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-roast">Roast level</Label>
                <Input
                  id="product-roast"
                  value={form.roastLevel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, roastLevel: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isEthical}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isEthical: e.target.checked }))
                  }
                />
                Ethically sourced
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Active (visible in shop)
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" onClick={saveProduct}>
                {selectedId === "new" ? "Create product" : "Save changes"}
              </Button>
              {selectedId !== "new" && (
                <Button
                  type="button"
                  variant="secondary"
                  className="border-red-200 text-red-800 hover:bg-red-50"
                  onClick={deleteProduct}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
