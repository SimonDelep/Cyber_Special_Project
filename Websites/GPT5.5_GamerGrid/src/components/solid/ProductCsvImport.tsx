import { createSignal, Show } from 'solid-js';
import type { ProductDTO } from '@/lib/types';

interface Props {
  categories: { id: string; name: string; slug: string }[];
  onImported: (products: ProductDTO[]) => void;
  onFlash: (message: string, isError?: boolean) => void;
}

type ImportResult = {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
};

export default function ProductCsvImport(props: Props) {
  const [file, setFile] = createSignal<File | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal<ImportResult | null>(null);

  const handleImport = async () => {
    const selected = file();
    if (!selected) {
      props.onFlash('Choose a CSV file first.', true);
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok && !json.created) {
        throw new Error(json.error ?? 'Import failed.');
      }

      setResult({
        created: json.created ?? 0,
        failed: json.failed ?? 0,
        errors: json.errors ?? [],
      });

      if (json.products?.length) {
        props.onImported(json.products);
      }

      if (json.created > 0) {
        props.onFlash(
          `Imported ${json.created} product${json.created === 1 ? '' : 's'}${
            json.failed ? ` (${json.failed} row${json.failed === 1 ? '' : 's'} skipped)` : ''
          }.`,
        );
      } else {
        props.onFlash('No products were created. Check row errors below.', true);
      }

      setFile(null);
    } catch (err) {
      props.onFlash(err instanceof Error ? err.message : 'Import failed.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="rounded-2xl border border-stream-500/20 bg-slate-900/60 p-6 space-y-4">
      <div>
        <h3 class="text-lg font-semibold text-white">Import products from CSV</h3>
        <p class="mt-2 text-sm text-slate-400">
          Upload a comma-separated file to create multiple products at once. Download the{' '}
          <a
            href="/samples/products-import-sample.csv"
            class="font-medium text-volt-400 hover:text-volt-300 underline-offset-2 hover:underline"
            download
          >
            sample CSV
          </a>{' '}
          to see the required format.
        </p>
      </div>

      <dl class="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <dt class="font-medium text-slate-400">Required columns</dt>
          <dd class="mt-1 font-mono">
            category_id <span class="text-slate-600">or</span> category_slug, name, description,
            price, image
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-400">Optional columns</dt>
          <dd class="mt-1 font-mono">slug, badge, featured (true/false)</dd>
        </div>
      </dl>

      <Show when={props.categories.length > 0}>
        <p class="text-xs text-slate-500">
          Valid category IDs:{' '}
          {props.categories.map((c) => (
            <code class="mr-2 rounded bg-black/30 px-1 py-0.5 text-stream-400">{c.id}</code>
          ))}
        </p>
      </Show>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="flex-1 text-sm">
          <span class="text-slate-400">CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            class="mt-1 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-volt-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-volt-500"
            onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          disabled={loading() || !file()}
          onClick={handleImport}
          class="rounded-full bg-stream-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stream-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading() ? 'Importing…' : 'Upload & import'}
        </button>
      </div>

      <Show when={result()}>
        {(r) => (
          <div class="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm">
            <p class="text-slate-300">
              <span class="font-medium text-stream-400">{r().created}</span> created ·{' '}
              <span class="font-medium text-amber-400">{r().failed}</span> failed
            </p>
            <Show when={r().errors.length > 0}>
              <ul class="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-red-200/90">
                {r().errors.map((err) => (
                  <li>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
