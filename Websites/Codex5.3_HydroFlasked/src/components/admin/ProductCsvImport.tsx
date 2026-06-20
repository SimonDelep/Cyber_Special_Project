"use client";

import { useRef, useState } from "react";
import type { Product } from "../../../generated/prisma/client";
import { parseApiResponse } from "@/lib/parse-api-response";

type ImportError = { row: number; message: string };

type ProductCsvImportProps = {
  onImported: (products: Product[]) => void;
};

export function ProductCsvImport({ onImported }: ProductCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file to upload");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Import failed");
        return;
      }

      const created = (data.created as number) ?? 0;
      const failed = (data.failed as number) ?? 0;
      const products = (data.products as Product[]) ?? [];
      const errors = (data.errors as ImportError[]) ?? [];

      if (products.length > 0) {
        onImported(products);
      }

      setImportErrors(errors);

      if (created > 0 && failed === 0) {
        setMessage(`Successfully imported ${created} product${created !== 1 ? "s" : ""}.`);
      } else if (created > 0) {
        setMessage(
          `Imported ${created} product${created !== 1 ? "s" : ""}; ${failed} row${failed !== 1 ? "s" : ""} failed.`,
        );
      } else {
        setError("No products were imported. Fix the errors below and try again.");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Network error during import.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Import products from CSV</h3>
      <p className="mt-2 text-sm text-slate-400">
        Upload a comma-separated file to bulk-create catalog items. Duplicate slugs in the
        file or database are skipped with an error.
      </p>

      <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950/50 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-300">Required columns</p>
        <p className="mt-1 font-mono text-xs">
          name, slug, description, category, price_dollars
        </p>
        <p className="mt-3 font-medium text-slate-300">Optional columns</p>
        <p className="mt-1 font-mono text-xs">
          price_cents, image_url, featured, in_stock
        </p>
        <p className="mt-3">
          <span className="text-slate-300">Category values: </span>
          TUMBLER, GLASSWARE, WINE_MUG
        </p>
        <a
          href="/samples/products-import-sample.csv"
          download="products-import-sample.csv"
          className="mt-4 inline-flex text-sm font-medium text-brand-400 hover:text-brand-300"
        >
          Download sample CSV →
        </a>
      </div>

      <form onSubmit={handleUpload} className="mt-6 flex flex-wrap items-end gap-4">
        <label className="min-w-[200px] flex-1">
          <span className="text-sm text-slate-300">CSV file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-2 block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
        >
          {loading ? "Importing…" : "Upload & import"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg bg-brand-500/10 px-3 py-2 text-sm text-brand-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {importErrors.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-amber-300">Import issues</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-slate-400">
            {importErrors.map((err, idx) => (
              <li key={`${err.row}-${idx}`}>
                {err.row > 0 ? (
                  <>
                    Row {err.row}: {err.message}
                  </>
                ) : (
                  err.message
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
