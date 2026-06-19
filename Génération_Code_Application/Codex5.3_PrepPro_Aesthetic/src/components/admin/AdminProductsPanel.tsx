import { createSignal, For, Show } from "solid-js";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORIES } from "@/lib/products/validate";

const emptyForm = () => ({
  name: "",
  slug: "",
  description: "",
  category: "meal-prep",
  priceDollars: "",
  imageUrl: "/images/solo-prep.svg",
  featured: false,
  stackable: true,
  leakProof: false,
  capacityMl: "",
});

function centsFromDollars(value: string): number | null {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function AdminProductsPanel() {
  const [products, setProducts] = createSignal<Product[]>([]);
  const [selectedId, setSelectedId] = createSignal<number | "new" | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal("");
  const [importing, setImporting] = createSignal(false);
  const [importMessage, setImportMessage] = createSignal("");
  const [importError, setImportError] = createSignal("");
  const [importRowErrors, setImportRowErrors] = createSignal<
    { row: number; message: string }[]
  >([]);

  let csvInputEl: HTMLInputElement | undefined;

  const [form, setForm] = createSignal(emptyForm());

  function loadFormFromProduct(p: Product) {
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      category: p.category,
      priceDollars: (p.priceCents / 100).toFixed(2),
      imageUrl: p.imageUrl,
      featured: p.featured,
      stackable: p.stackable,
      leakProof: p.leakProof,
      capacityMl: p.capacityMl != null ? String(p.capacityMl) : "",
    });
  }

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load products.");
        return;
      }
      setProducts(json.products ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setSelectedId("new");
    setForm(emptyForm());
    setMessage("");
    setError("");
  }

  function selectProduct(p: Product) {
    setSelectedId(p.id);
    loadFormFromProduct(p);
    setMessage("");
    setError("");
  }

  function updateField<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveProduct() {
    setSaving(true);
    setMessage("");
    setError("");

    const f = form();
    const priceCents = centsFromDollars(f.priceDollars);
    if (priceCents === null) {
      setError("Price must be a valid non-negative amount.");
      setSaving(false);
      return;
    }

    const payload = {
      name: f.name.trim(),
      slug: f.slug.trim() || undefined,
      description: f.description.trim(),
      category: f.category,
      priceCents,
      imageUrl: f.imageUrl.trim(),
      featured: f.featured,
      stackable: f.stackable,
      leakProof: f.leakProof,
      capacityMl: f.capacityMl === "" ? null : Number(f.capacityMl),
    };

    const id = selectedId();
    const isNew = id === "new";

    try {
      const res = await fetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Save failed.");
        return;
      }

      if (isNew) {
        setProducts((list) => [json.product, ...list]);
        selectProduct(json.product);
        setMessage("Product created.");
      } else {
        setProducts((list) =>
          list.map((p) => (p.id === json.product.id ? json.product : p)),
        );
        setMessage("Product updated.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvImport() {
    setImportMessage("");
    setImportError("");
    setImportRowErrors([]);

    const file = csvInputEl?.files?.[0];
    if (!file) {
      setImportError("Choose a CSV file to upload.");
      return;
    }

    const data = new FormData();
    data.set("file", file);

    setImporting(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setImportError(json.error ?? "Import failed.");
        return;
      }

      const created = json.created ?? 0;
      const failed = json.failed ?? 0;
      if (created > 0) {
        setProducts((list) => [...(json.products ?? []), ...list]);
      }
      setImportRowErrors(json.errors ?? []);
      setImportMessage(
        `Import finished: ${created} product(s) created${failed > 0 ? `, ${failed} row(s) skipped` : ""}.`,
      );
      if (csvInputEl) csvInputEl.value = "";
    } catch {
      setImportError("Network error during import.");
    } finally {
      setImporting(false);
    }
  }

  async function deleteProduct() {
    const id = selectedId();
    if (id === null || id === "new") return;
    if (!confirm("Delete this product?")) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Delete failed.");
        return;
      }
      setProducts((list) => list.filter((p) => p.id !== id));
      setSelectedId(null);
      setMessage("Product deleted.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  loadProducts();

  return (
    <div class="space-y-8">
      <section class="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-ink">Import products from CSV</h2>
        <p class="mt-2 text-sm text-muted">
          Bulk-create products from a spreadsheet. Required columns:{" "}
          <span class="font-mono text-ink">name</span>,{" "}
          <span class="font-mono text-ink">description</span>,{" "}
          <span class="font-mono text-ink">category</span> (
          <span class="font-mono">meal-prep</span> or{" "}
          <span class="font-mono">bento</span>), and either{" "}
          <span class="font-mono text-ink">price_dollars</span> or{" "}
          <span class="font-mono text-ink">price_cents</span>.
        </p>
        <a
          href="/samples/products-import-sample.csv"
          download="products-import-sample.csv"
          class="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
        >
          Download sample CSV template
        </a>

        <div class="mt-4 flex flex-wrap items-end gap-3">
          <label class="flex flex-1 flex-col gap-1 text-sm min-w-[12rem]">
            <span class="font-medium text-ink">CSV file</span>
            <input
              ref={(el) => {
                csvInputEl = el;
              }}
              type="file"
              accept=".csv,text/csv"
              class="rounded-lg border border-brand-200 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-brand-800"
            />
          </label>
          <button
            type="button"
            disabled={importing()}
            onClick={handleCsvImport}
            class="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {importing() ? "Importing…" : "Upload & import"}
          </button>
        </div>

        <Show when={importMessage()}>
          <p class="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {importMessage()}
          </p>
        </Show>
        <Show when={importError()}>
          <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {importError()}
          </p>
        </Show>
        <Show when={importRowErrors().length > 0}>
          <ul class="mt-4 max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50/50 px-3 py-2 text-sm text-red-800">
            <For each={importRowErrors()}>
              {(err) => (
                <li>
                  Row {err.row}: {err.message}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </section>

    <div class="grid gap-8 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <button
          type="button"
          onClick={startNew}
          class="mb-4 w-full rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New product
        </button>

        <Show when={loading()}>
          <p class="text-muted">Loading products…</p>
        </Show>

        <Show when={!loading()}>
          <div class="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
            <ul class="max-h-[28rem] divide-y divide-brand-50 overflow-y-auto">
              <For each={products()}>
                {(p) => (
                  <li>
                    <button
                      type="button"
                      class={`w-full px-4 py-3 text-left transition hover:bg-brand-50 ${
                        selectedId() === p.id ? "bg-brand-50" : ""
                      }`}
                      onClick={() => selectProduct(p)}
                    >
                      <span class="font-medium text-ink">{p.name}</span>
                      <span class="block text-xs text-muted">
                        {formatPrice(p.priceCents)} · {p.category}
                        {p.featured ? " · featured" : ""}
                      </span>
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>

      <div class="lg:col-span-3">
        <Show
          when={selectedId() !== null}
          fallback={
            <p class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center text-muted">
              Select a product or create a new one.
            </p>
          }
        >
          <form
            class="space-y-4 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              saveProduct();
            }}
          >
            <h2 class="text-lg font-semibold text-ink">
              {selectedId() === "new" ? "New product" : "Edit product"}
            </h2>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-ink">Name</label>
                <input
                  type="text"
                  required
                  value={form().name}
                  onInput={(e) => updateField("name", e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-ink">Slug</label>
                <input
                  type="text"
                  value={form().slug}
                  onInput={(e) => updateField("slug", e.currentTarget.value)}
                  placeholder="auto-generated if empty"
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-ink">Description</label>
              <textarea
                rows={3}
                required
                value={form().description}
                onInput={(e) => updateField("description", e.currentTarget.value)}
                class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="block text-sm font-medium text-ink">Category</label>
                <select
                  value={form().category}
                  onChange={(e) => updateField("category", e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                >
                  <For each={[...PRODUCT_CATEGORIES]}>
                    {(c) => <option value={c}>{c}</option>}
                  </For>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-ink">Price (CAD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form().priceDollars}
                  onInput={(e) => updateField("priceDollars", e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-ink">Capacity (ml)</label>
                <input
                  type="number"
                  min="0"
                  value={form().capacityMl}
                  onInput={(e) => updateField("capacityMl", e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-ink">Image URL</label>
              <input
                type="text"
                value={form().imageUrl}
                onInput={(e) => updateField("imageUrl", e.currentTarget.value)}
                class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
              />
            </div>

            <div class="flex flex-wrap gap-4 text-sm">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form().featured}
                  onChange={(e) => updateField("featured", e.currentTarget.checked)}
                />
                Featured
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form().stackable}
                  onChange={(e) => updateField("stackable", e.currentTarget.checked)}
                />
                Stackable
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form().leakProof}
                  onChange={(e) => updateField("leakProof", e.currentTarget.checked)}
                />
                Leak-proof
              </label>
            </div>

            <Show when={message()}>
              <p class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                {message()}
              </p>
            </Show>
            <Show when={error()}>
              <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error()}
              </p>
            </Show>

            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving()}
                class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving() ? "Saving…" : selectedId() === "new" ? "Create product" : "Save changes"}
              </button>
              <Show when={selectedId() !== "new"}>
                <button
                  type="button"
                  disabled={saving()}
                  onClick={deleteProduct}
                  class="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Delete product
                </button>
              </Show>
            </div>
          </form>
        </Show>
      </div>
    </div>
    </div>
  );
}
