"use client";

import { useState } from "react";
import { ProductCategory } from "@prisma/client";
import type { AdminProduct } from "@/types/admin";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { PRODUCT_CATEGORIES } from "@/lib/admin/validation";

type ProductFormProps = {
  product?: AdminProduct;
  onSuccess: (product: AdminProduct) => void;
};

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const isEdit = !!product;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      slug: formData.get("slug"),
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      category: formData.get("category"),
      featured: formData.get("featured") === "on",
      inStock: formData.get("inStock") === "on",
      imageUrl: formData.get("imageUrl") || "",
    };

    try {
      const url = isEdit
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }

      onSuccess({
        id: data.product.id,
        slug: data.product.slug,
        name: data.product.name,
        description: data.product.description,
        price: Number(data.product.price),
        category: data.product.category,
        featured: data.product.featured,
        inStock: data.product.inStock,
        imageUrl: data.product.imageUrl,
      });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert type="error" message={error} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
        />
        <FormField
          label="Slug"
          name="slug"
          required
          defaultValue={product?.slug ?? ""}
          placeholder="product-slug"
        />
        <FormField
          label="Price (CAD)"
          name="price"
          type="number"
          required
          defaultValue={product ? String(product.price) : ""}
        />
        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category <span className="text-accent">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={product?.category ?? ProductCategory.WIRELESS_CHARGING}
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormField
        label="Description"
        name="description"
        as="textarea"
        required
        rows={4}
        defaultValue={product?.description ?? ""}
      />
      <FormField
        label="Image URL"
        name="imageUrl"
        type="url"
        defaultValue={product?.imageUrl ?? ""}
        placeholder="https://..."
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
            className="rounded border-border"
          />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="inStock"
            defaultChecked={product?.inStock ?? true}
            className="rounded border-border"
          />
          In stock
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent px-8 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
      >
        {loading ? "Saving…" : isEdit ? "Update product" : "Create product"}
      </button>
    </form>
  );
}
