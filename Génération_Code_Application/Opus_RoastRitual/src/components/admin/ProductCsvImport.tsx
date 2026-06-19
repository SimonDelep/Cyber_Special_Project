"use client";

import { useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

type ImportError = {
  row: number;
  message: string;
};

type ProductCsvImportProps = {
  onImported: () => void;
};

const SAMPLE_CSV_PATH = "/samples/roastritual-products-import-sample.csv";

export function ProductCsvImport({ onImported }: ProductCsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setImportErrors([]);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage({ type: "error", text: "Choose a CSV file first." });
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok && !data.created) {
        setMessage({
          type: "error",
          text: data.error ?? "Import failed",
        });
        if (Array.isArray(data.errors)) {
          setImportErrors(data.errors as ImportError[]);
        }
        return;
      }

      const created = (data.created as number) ?? 0;
      const failed = (data.failed as number) ?? 0;

      setMessage({
        type: created > 0 ? "success" : "error",
        text:
          created > 0
            ? `Imported ${created} product${created !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} row${failed !== 1 ? "s" : ""} skipped)` : ""}.`
            : "No products were imported.",
      });

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setImportErrors(data.errors as ImportError[]);
      }

      if (created > 0) {
        onImported();
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      setMessage({ type: "error", text: "Unable to reach the server." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-sage/25 bg-linen p-6">
      <h2 className="font-display text-xl text-espresso">Import products (CSV)</h2>
      <p className="mt-2 text-sm text-espresso/70">
        Upload a CSV file to create multiple products at once. Required columns:{" "}
        <span className="font-mono text-xs">name</span>,{" "}
        <span className="font-mono text-xs">description</span>,{" "}
        <span className="font-mono text-xs">category</span> (COFFEE or TEA),{" "}
        <span className="font-mono text-xs">price_dollars</span>. Optional: slug,
        image_url, origin, roast_level, is_ethical, is_active.
      </p>

      <p className="mt-3">
        <a
          href={SAMPLE_CSV_PATH}
          download="roastritual-products-import-sample.csv"
          className="text-sm font-medium text-sage-dark underline hover:text-espresso"
        >
          Download sample CSV template
        </a>
      </p>

      <form onSubmit={(e) => void handleUpload(e)} className="mt-6 space-y-4">
        {message && <Alert variant={message.type}>{message.text}</Alert>}

        <div>
          <Label htmlFor="product-csv-file">CSV file</Label>
          <input
            ref={fileInputRef}
            id="product-csv-file"
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full text-sm text-espresso/70 file:mr-4 file:rounded-full file:border-0 file:bg-sage/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-sage/30"
          />
        </div>

        <Button type="submit" disabled={uploading}>
          {uploading ? "Importing…" : "Upload and import"}
        </Button>
      </form>

      {importErrors.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-espresso">Import issues</p>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-red-800">
            {importErrors.map((err, index) => (
              <li key={`${err.row}-${index}`}>
                {err.row > 0 ? `Row ${err.row}: ` : ""}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
