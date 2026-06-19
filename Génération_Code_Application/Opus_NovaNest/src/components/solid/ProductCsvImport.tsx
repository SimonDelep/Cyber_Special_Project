import { createSignal, For, Show } from 'solid-js';
import { CSV_HEADERS } from '../../lib/products/csv-import-constants';

interface ImportResult {
  row: number;
  ok: boolean;
  slug?: string;
  productId?: number;
  error?: string;
}

interface Props {
  onImported: () => void | Promise<void>;
  onMessage: (type: 'ok' | 'err', text: string) => void;
  loading: () => boolean;
  setLoading: (value: boolean) => void;
}

export default function ProductCsvImport(props: Props) {
  const [results, setResults] = createSignal<ImportResult[] | null>(null);
  const [summary, setSummary] = createSignal<{
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    const input = document.getElementById('product-csv-file') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      props.onMessage('err', 'Choose a CSV file first.');
      return;
    }

    props.setLoading(true);
    setResults(null);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.set('file', file);

      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        props.onMessage('err', json.error ?? 'Import failed.');
        return;
      }

      setSummary({
        created: json.created,
        skipped: json.skipped,
        failed: json.failed,
      });
      setResults(json.results ?? []);

      props.onMessage(
        'ok',
        `Import finished: ${json.created} created, ${json.skipped} skipped, ${json.failed} failed.`,
      );
      await props.onImported();
      if (input) input.value = '';
    } catch {
      props.onMessage('err', 'Network error during import.');
    } finally {
      props.setLoading(false);
    }
  }

  const columns = CSV_HEADERS.join(', ');

  return (
    <section class="space-y-4 rounded-2xl border border-white/10 bg-nest-900/50 p-6">
      <div>
        <h2 class="font-display text-lg font-semibold text-white">Import products from CSV</h2>
        <p class="mt-1 text-sm text-nest-100/60">
          Upload a comma-separated file to create many products at once. Duplicate slugs are
          skipped.
        </p>
      </div>

      <div class="rounded-lg border border-white/10 bg-nest-950/50 p-4 text-sm text-nest-100/70">
        <p class="font-medium text-nest-100/90">Required columns (header row):</p>
        <p class="mt-1 font-mono text-xs text-accent">{columns}</p>
        <ul class="mt-3 list-inside list-disc space-y-1 text-xs">
          <li>
            <strong class="text-nest-100/80">price_cents</strong> — integer (e.g. 7999 for
            $79.99)
          </li>
          <li>
            <strong class="text-nest-100/80">category</strong> — doorbell-cameras or
            smart-lighting
          </li>
          <li>
            <strong class="text-nest-100/80">featured</strong> — true/false, 1/0, or yes/no
          </li>
          <li>
            <strong class="text-nest-100/80">image</strong> — path like /images/products/… or
            https URL
          </li>
        </ul>
        <a
          href="/samples/novanest-products-import-sample.csv"
          download="novanest-products-import-sample.csv"
          class="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Download sample CSV template →
        </a>
      </div>

      <form onSubmit={handleSubmit} class="flex flex-wrap items-end gap-4">
        <label class="block min-w-[12rem] flex-1 space-y-1">
          <span class="text-sm text-nest-100/70">CSV file</span>
          <input
            id="product-csv-file"
            type="file"
            accept=".csv,text/csv"
            class="block w-full text-sm text-nest-100/70 file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-nest-950"
          />
        </label>
        <button
          type="submit"
          disabled={props.loading()}
          class="rounded-full border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-50"
        >
          {props.loading() ? 'Importing…' : 'Upload & import'}
        </button>
      </form>

      <Show when={summary()}>
        {(s) => (
          <div class="space-y-3">
            <p class="text-sm text-nest-100/80">
              Created: <span class="text-accent">{s().created}</span> · Skipped:{' '}
              <span class="text-amber-300">{s().skipped}</span> · Failed:{' '}
              <span class="text-red-300">{s().failed}</span>
            </p>
            <Show when={results() && results()!.length > 0}>
              <div class="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                <table class="w-full text-left text-xs">
                  <thead class="sticky top-0 bg-nest-900 text-nest-100/60">
                    <tr>
                      <th class="px-3 py-2">Row</th>
                      <th class="px-3 py-2">Status</th>
                      <th class="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/10">
                    <For each={results()!.filter((r) => !r.ok)}>
                      {(r) => (
                        <tr>
                          <td class="px-3 py-2">{r.row}</td>
                          <td class="px-3 py-2 text-red-300">Error</td>
                          <td class="px-3 py-2 text-nest-100/70">{r.error}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </section>
  );
}
