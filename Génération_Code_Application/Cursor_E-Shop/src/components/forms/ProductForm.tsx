"use client";

import { useActionState, useId } from "react";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/lib/action-state";

interface ProductFormDefaults {
  name: string;
  slug: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: string;
}

interface ProductFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Partial<ProductFormDefaults>;
  submitLabel?: string;
  autoSlug?: boolean;
}

const initialState: ActionState = {};

const categories = [
  "phones",
  "laptops",
  "audio",
  "accessories",
];

export function ProductForm({
  action,
  defaultValues = {},
  submitLabel = "Save product",
  autoSlug = false,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const slugId = useId();
  const nameId = useId();

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? (
        <Alert variant="success">Product saved successfully.</Alert>
      ) : null}
      <Input
        label="Name"
        name="name"
        id={nameId}
        defaultValue={defaultValues.name ?? ""}
        required
        error={state.fieldErrors?.name?.[0]}
        onChange={
          autoSlug
            ? (e) => {
                const slugInput = document.getElementById(
                  slugId
                ) as HTMLInputElement | null;
                if (slugInput && !slugInput.dataset.touched) {
                  slugInput.value = slugify(e.target.value);
                }
              }
            : undefined
        }
      />
      <Input
        label="Slug"
        name="slug"
        id={slugId}
        defaultValue={defaultValues.slug ?? ""}
        required
        pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
        error={state.fieldErrors?.slug?.[0]}
        onChange={
          autoSlug
            ? (e) => {
                const el = e.target as HTMLInputElement;
                el.dataset.touched = "1";
              }
            : undefined
        }
      />
      {autoSlug ? (
        <p className="-mt-3 text-xs text-zinc-500">
          Slug auto-fills from the name; edit it if needed.
        </p>
      ) : null}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues.description ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>
      <Input
        label="Price (CAD)"
        name="price"
        type="number"
        step="0.01"
        min="0.01"
        defaultValue={defaultValues.price ?? ""}
        required
        error={state.fieldErrors?.price?.[0]}
      />
      <Input
        label="Image URL (optional)"
        name="imageUrl"
        type="url"
        defaultValue={defaultValues.imageUrl ?? ""}
        placeholder="https://..."
        error={state.fieldErrors?.imageUrl?.[0]}
      />
      <div className="space-y-1.5">
        <label htmlFor="category" className="block text-sm font-medium text-zinc-300">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues.category ?? "phones"}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-sm text-zinc-100"
          required
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {state.fieldErrors?.category?.[0] ? (
          <p className="text-sm text-red-400">{state.fieldErrors.category[0]}</p>
        ) : null}
      </div>
      <Input
        label="Stock (optional)"
        name="stock"
        type="number"
        min={0}
        step={1}
        defaultValue={defaultValues.stock ?? ""}
        error={state.fieldErrors?.stock?.[0]}
      />
      <SubmitButton pendingLabel="Saving…">{submitLabel}</SubmitButton>
    </form>
  );
}
