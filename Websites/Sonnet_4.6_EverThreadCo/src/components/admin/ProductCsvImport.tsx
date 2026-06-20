"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PRODUCT_CSV_HEADERS } from "@/lib/admin/parse-product-csv";
import type { AdminCategory, AdminProductRow } from "@/components/admin/ProductsManager";

type ImportError = {
  row: number;
  field?: string;
  message: string;
};

type ProductCsvImportProps = {
  categories: AdminCategory[];
  onImported: (products: AdminProductRow[]) => void;
};

export function ProductCsvImport({
  categories,
  onImported,
}: ProductCsvImportProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<ImportError[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setRowErrors([]);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed");
      if (Array.isArray(data.errors)) {
        setRowErrors(data.errors);
      }
      return;
    }

    onImported(data.products);
    setMessage(data.message ?? "Import complete");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  const categoryHint =
    categories.length > 0
      ? categories.map((c) => c.slug).join(", ")
      : "none";

  return (
    <section className="rounded-xl border border-sand-200 bg-cream-50 p-6">
      <h3 className="font-display text-xl text-sand-900">Import from CSV</h3>
      <p className="mt-2 text-sm text-sand-600">
        Upload a CSV to create multiple products at once. Use the sample file
        as a template.
      </p>

      <dl className="mt-4 space-y-2 text-xs text-sand-600">
        <div>
          <dt className="font-medium text-sand-800">Required columns</dt>
          <dd className="mt-0.5 font-mono">
            name, description, price, category_slug
          </dd>
        </div>
        <div>
          <dt className="font-medium text-sand-800">Optional columns</dt>
          <dd className="mt-0.5 font-mono">
            {PRODUCT_CSV_HEADERS.filter(
              (h) =>
                !["name", "description", "price", "category_slug"].includes(h),
            ).join(", ")}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-sand-800">Valid category_slug values</dt>
          <dd className="mt-0.5 font-mono">{categoryHint}</dd>
        </div>
        <div>
          <dt className="font-medium text-sand-800">Price</dt>
          <dd className="mt-0.5">Decimal CAD (e.g. 48.00). Slug is auto-generated from name if omitted.</dd>
        </div>
      </dl>

      <a
        href="/samples/products-import-sample.csv"
        download="products-import-sample.csv"
        className="mt-4 inline-block text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        Download sample CSV
      </a>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] flex-1">
          <label
            htmlFor="product-csv"
            className="text-sm font-medium text-sand-800"
          >
            CSV file
          </label>
          <input
            id="product-csv"
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1.5 block w-full text-sm text-sand-700 file:mr-4 file:rounded-full file:border-0 file:bg-sage-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sage-800 hover:file:bg-sage-200"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Importing…" : "Upload & import"}
        </Button>
      </form>

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
      {rowErrors.length > 0 ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-red-100 bg-red-50/50 p-3 text-xs text-red-900">
          {rowErrors.map((err, i) => (
            <li key={`${err.row}-${err.field ?? ""}-${i}`}>
              Row {err.row}
              {err.field ? ` (${err.field})` : ""}: {err.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
