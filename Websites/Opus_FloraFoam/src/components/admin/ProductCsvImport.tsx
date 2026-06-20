"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importProductsCsvAction, type CsvImportActionState } from "@/app/admin/actions";
import { FormMessage } from "@/components/ui/FormField";
import { PRODUCT_CSV_HEADERS } from "@/lib/products/parse-product-csv";

const initialState: CsvImportActionState = {};

const SAMPLE_CSV_PATH = "/samples/florafoam-products-import-sample.csv";

export function ProductCsvImport() {
  const [state, formAction, pending] = useActionState(importProductsCsvAction, initialState);

  return (
    <div className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6">
      <h2 className="font-display text-xl font-semibold text-sage-900">Import products from CSV</h2>
      <p className="mt-2 text-sm text-sage-600">
        Upload a CSV file to create multiple products at once. Existing slugs in the catalog are
        skipped with a warning.
      </p>

      <div className="mt-4 rounded-xl border border-sage-200/80 bg-white/60 p-4 text-sm text-sage-700">
        <p className="font-medium text-sage-900">Required columns</p>
        <p className="mt-1 font-mono text-xs text-sage-600">{PRODUCT_CSV_HEADERS}</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sage-600">
          <li>
            <span className="font-medium text-sage-800">category</span>:{" "}
            <code className="text-xs">SERUM</code>, <code className="text-xs">NIGHT_CREAM</code>,
            or <code className="text-xs">EYE_PATCH</code>
          </li>
          <li>
            <span className="font-medium text-sage-800">price_dollars</span>: decimal amount (e.g.{" "}
            <code className="text-xs">42.00</code>)
          </li>
          <li>
            <span className="font-medium text-sage-800">featured</span> /{" "}
            <span className="font-medium text-sage-800">in_stock</span>:{" "}
            <code className="text-xs">true</code> or <code className="text-xs">false</code>
          </li>
          <li>
            <span className="font-medium text-sage-800">image_url</span>: optional http(s) URL
          </li>
        </ul>
        <a
          href={SAMPLE_CSV_PATH}
          download="florafoam-products-import-sample.csv"
          className="mt-4 inline-flex text-sm font-medium text-sage-800 underline hover:text-sage-900"
        >
          Download sample CSV
        </a>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium text-sage-800">
            CSV file
          </label>
          <input
            id="csv-file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={pending}
            className="mt-2 block w-full text-sm text-sage-700 file:mr-4 file:rounded-full file:border-0 file:bg-sage-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cream-50 hover:file:bg-sage-900 disabled:opacity-50"
          />
        </div>

        {state.error && <FormMessage type="error" message={state.error} />}
        {state.success && state.message && (
          <FormMessage type="success" message={state.message} />
        )}

        {state.rowErrors && state.rowErrors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-4">
            <p className="text-sm font-medium text-red-800">Row errors</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-red-700">
              {state.rowErrors.map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.skippedSlugs && state.skippedSlugs.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-medium text-amber-900">Skipped (slug already exists)</p>
            <p className="mt-1 text-sm text-amber-800">{state.skippedSlugs.join(", ")}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Importing…" : "Import products"}
          </button>
          <Link
            href="/admin/products"
            className="rounded-full border border-sage-300 px-6 py-2.5 text-sm font-medium text-sage-800 hover:bg-sage-50"
          >
            Back to products
          </Link>
        </div>
      </form>
    </div>
  );
}
