"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type ImportResult = {
  created: number;
  skipped: number;
  message?: string;
  createdProducts?: { row: number; name: string; slug: string }[];
  skippedProducts?: { row: number; name: string; reason: string }[];
  errors?: { row: number; message: string }[];
};

interface ProductCsvImportProps {
  onImported: () => Promise<void>;
}

export function ProductCsvImport({ onImported }: ProductCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError("");
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Import failed");
        if (data.errors?.length) {
          setResult({
            created: data.created ?? 0,
            skipped: data.skipped ?? 0,
            errors: data.errors,
          });
        }
        return;
      }

      setResult(data);
      await onImported();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-stone/15 bg-cream/50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-xl text-charcoal">Import products from CSV</h3>
          <p className="mt-2 max-w-2xl text-sm text-stone">
            Upload a CSV file to create multiple products at once. Required
            columns: <code className="text-charcoal">name</code>,{" "}
            <code className="text-charcoal">description</code>,{" "}
            <code className="text-charcoal">price</code>,{" "}
            <code className="text-charcoal">category</code>. Optional:{" "}
            <code className="text-charcoal">slug</code>,{" "}
            <code className="text-charcoal">imageUrl</code>,{" "}
            <code className="text-charcoal">inStock</code>,{" "}
            <code className="text-charcoal">featured</code>.
          </p>
          <a
            href="/samples/products-import-sample.csv"
            download
            className="mt-3 inline-block text-sm font-medium text-ember transition-colors hover:text-ember-dark"
          >
            Download sample CSV &darr;
          </a>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Button
            variant="secondary"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Importing..." : "Upload CSV"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3 rounded-xl border border-sage/20 bg-sage/10 px-4 py-3 text-sm text-charcoal">
          {result.message && <p>{result.message}</p>}
          <p>
            Created: {result.created} · Skipped: {result.skipped}
          </p>

          {result.createdProducts && result.createdProducts.length > 0 && (
            <div>
              <p className="font-medium">Created products</p>
              <ul className="mt-1 list-inside list-disc text-stone">
                {result.createdProducts.map((product) => (
                  <li key={`${product.row}-${product.slug}`}>
                    Row {product.row}: {product.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.skippedProducts && result.skippedProducts.length > 0 && (
            <div>
              <p className="font-medium">Skipped rows</p>
              <ul className="mt-1 list-inside list-disc text-stone">
                {result.skippedProducts.map((product) => (
                  <li key={`${product.row}-${product.name}`}>
                    Row {product.row}: {product.name} — {product.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div>
              <p className="font-medium">Row errors</p>
              <ul className="mt-1 list-inside list-disc text-stone">
                {result.errors.map((item) => (
                  <li key={`${item.row}-${item.message}`}>
                    Row {item.row}: {item.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
