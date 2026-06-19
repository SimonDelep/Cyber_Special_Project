"use client";

import { useFormStatus } from "react-dom";
import { deleteProductAction } from "@/actions/admin/products";

interface DeleteProductButtonProps {
  productId: string;
  productName?: string;
}

function DeleteSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-red-400 transition hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}

export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const label = "Delete";

  return (
    <form
      action={deleteProductAction.bind(null, productId)}
      className="inline"
      onSubmit={(e) => {
        const name = productName ? ` "${productName}"` : "";
        if (
          !confirm(
            `Delete product${name}? This cannot be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <DeleteSubmit label={label} />
    </form>
  );
}
