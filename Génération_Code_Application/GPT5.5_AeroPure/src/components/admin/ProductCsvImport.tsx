"use client";

import { useState } from "react";
import type { AdminProduct } from "@/types/admin";
import { Alert } from "@/components/ui/Alert";

type ProductCsvImportProps = {
  onImported: (products: AdminProduct[]) => void;
  onNotify: (msg: string | null) => void;
};

type ImportError = { row: number; slug?: string; message: string };

export function ProductCsvImport({
  onImported,
  onNotify,
}: ProductCsvImportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    failed: number;
    errors: ImportError[];
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!file || !(file instanceof File) || file.size === 0) {
      setError("Please select a CSV file");
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }

      setResult({
        created: data.created,
        failed: data.failed,
        errors: data.errors ?? [],
      });

      if (data.products?.length) {
        onImported(data.products);
      }

      onNotify(data.message);
      form.reset();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold">Import products from CSV</h3>
      <p className="mt-2 text-sm text-muted">
        Upload a CSV file to create multiple products at once. Download the
        template to see the required format.
      </p>

      <a
        href="/samples/products-import-template.csv"
        download="products-import-template.csv"
        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
      >
        Download sample CSV template →
      </a>

      <div className="mt-4 rounded-lg bg-border/20 p-4 text-xs text-muted">
        <p className="font-medium text-foreground">Required columns</p>
        <p className="mt-1 font-mono">
          slug, name, description, price, category
        </p>
        <p className="mt-3 font-medium text-foreground">Optional columns</p>
        <p className="mt-1 font-mono">featured, inStock, imageUrl</p>
        <p className="mt-3">
          Categories:{" "}
          <span className="font-mono">
            WIRELESS_CHARGING, SOLAR_POWER_BANK, TRAVEL_ORGANIZER
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <Alert type="error" message={error} />}
        {result && result.created > 0 && (
          <Alert
            type="success"
            message={`Successfully created ${result.created} product(s).`}
          />
        )}
        {result && result.failed > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <p className="font-medium">{result.failed} row(s) skipped</p>
            <ul className="mt-2 max-h-40 list-inside list-disc overflow-y-auto">
              {result.errors.map((err) => (
                <li key={`${err.row}-${err.slug ?? ""}`}>
                  Row {err.row}
                  {err.slug ? ` (${err.slug})` : ""}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium">
            CSV file
          </label>
          <input
            id="csv-file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-1 w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? "Importing…" : "Upload and import"}
        </button>
      </form>
    </div>
  );
}
