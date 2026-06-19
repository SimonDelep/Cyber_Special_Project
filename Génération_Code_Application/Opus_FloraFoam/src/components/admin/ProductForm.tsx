"use client";

import { useActionState } from "react";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { CATEGORY_LABELS } from "@/types/product";
import { centsToDollarsString } from "@/lib/validations/admin";
import type { Product, ProductCategory } from "@prisma/client";

const initialState: AdminActionState = {};

type ProductFormProps =
  | { mode: "create" }
  | {
      mode: "edit";
      product: Pick<
        Product,
        | "id"
        | "slug"
        | "name"
        | "description"
        | "category"
        | "priceCents"
        | "imageUrl"
        | "featured"
        | "inStock"
      >;
    };

export function ProductForm(props: ProductFormProps) {
  const isEdit = props.mode === "edit";
  const product = isEdit ? props.product : undefined;
  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const categories = Object.keys(CATEGORY_LABELS) as ProductCategory[];

  async function handleDelete() {
    if (!product) return;
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    await deleteProductAction(product.id);
  }

  return (
    <div className="space-y-6">
      {state.error && <FormMessage type="error" message={state.error} />}
      {state.success && <FormMessage type="success" message="Product saved successfully." />}

      <form action={formAction} className="space-y-4 rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
        {product && <input type="hidden" name="productId" value={product.id} />}

        <FormField
          label="Slug"
          name="slug"
          defaultValue={product?.slug ?? ""}
          hint="URL-friendly id, e.g. radiance-botanical-serum"
          error={state.fieldErrors?.slug?.[0]}
          required
        />
        <FormField
          label="Name"
          name="name"
          defaultValue={product?.name ?? ""}
          error={state.fieldErrors?.name?.[0]}
          required
        />
        <FormField label="Description" name="description" error={state.fieldErrors?.description?.[0]}>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            required
            className="w-full rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200"
          />
        </FormField>
        <FormField label="Category" name="category" error={state.fieldErrors?.category?.[0]}>
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? "SERUM"}
            className="w-full rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm text-sage-900 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Price (CAD)"
          name="priceDollars"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={product ? centsToDollarsString(product.priceCents) : ""}
          error={state.fieldErrors?.priceDollars?.[0]}
          required
        />
        <FormField
          label="Image URL"
          name="imageUrl"
          type="url"
          defaultValue={product?.imageUrl ?? ""}
          hint="Optional product image"
          error={state.fieldErrors?.imageUrl?.[0]}
        />

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-sage-800">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="rounded border-sage-300 text-sage-700 focus:ring-sage-500"
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-sage-800">
            <input
              type="checkbox"
              name="inStock"
              defaultChecked={product?.inStock ?? true}
              className="rounded border-sage-300 text-sage-700 focus:ring-sage-500"
            />
            In stock
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save product" : "Create product"}
        </button>
      </form>

      {product && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-6">
          <h3 className="font-medium text-red-900">Danger zone</h3>
          <p className="mt-1 text-sm text-red-800">Permanently remove this product from the catalog.</p>
          <button
            type="button"
            onClick={handleDelete}
            className="mt-4 rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            Delete product
          </button>
        </div>
      )}
    </div>
  );
}
