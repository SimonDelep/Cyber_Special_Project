import { FormEvent, useRef, useState } from "react";
import { importProductsCsv } from "../api/admin";

interface Props {
  onImported: () => void;
}

const SAMPLE_URL = "/samples/products_import_sample.csv";

export default function AdminProductCsvImport({ onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setResult(null);
      setErrors(["Choose a CSV file first."]);
      return;
    }
    setUploading(true);
    setResult(null);
    setErrors([]);
    try {
      const data = await importProductsCsv(file);
      if (data.created > 0) {
        setResult(`Created ${data.created} product${data.created !== 1 ? "s" : ""}.`);
        onImported();
      } else {
        setResult("No products were created.");
      }
      if (data.errors.length > 0) {
        setErrors(data.errors);
      }
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Import failed"]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-grid-border bg-grid-surface/60 p-6">
      <h2 className="font-display text-lg font-bold text-white">Import products from CSV</h2>
      <p className="mt-2 text-sm text-grid-muted">
        Upload a UTF-8 CSV with columns:{" "}
        <code className="text-grid-cyan">name</code>, <code className="text-grid-cyan">description</code>,{" "}
        <code className="text-grid-cyan">category</code> (keyboard, mouse, desk_mat),{" "}
        <code className="text-grid-cyan">price_cents</code> (or <code className="text-grid-cyan">price</code> in
        dollars), and optional <code className="text-grid-cyan">image_url</code>.
      </p>
      <a
        href={SAMPLE_URL}
        download="products_import_sample.csv"
        className="mt-3 inline-block text-sm font-medium text-grid-cyan hover:underline"
      >
        Download sample CSV
      </a>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex-1 text-sm text-grid-muted">
          CSV file
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-1.5 block w-full max-w-md text-sm text-grid-muted file:mr-4 file:rounded-lg file:border-0 file:bg-grid-cyan/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-grid-cyan"
          />
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-gradient-to-r from-grid-cyan to-grid-purple px-5 py-2.5 text-sm font-semibold text-grid-dark disabled:opacity-50"
        >
          {uploading ? "Importing…" : "Upload & import"}
        </button>
      </form>

      {result && <p className="mt-4 text-sm text-emerald-400">{result}</p>}
      {errors.length > 0 && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-amber-400">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
