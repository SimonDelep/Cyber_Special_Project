import { createSignal, createEffect, Show, For } from 'solid-js';
import type { PublicUser } from '@/types/auth';
import type { PublicProduct } from '@/types/product';
import { formatPrice, centsToDollars, dollarsToCents } from '@/lib/utils';
import AdminSystemLogs from './AdminSystemLogs';

type Props = {
  currentAdminId: number;
};

type Tab = 'users' | 'products' | 'logs';

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-3 py-2 text-sm text-cork-900 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

const btnPrimary =
  'rounded-full bg-cork-800 px-4 py-2 text-sm font-medium text-cork-50 hover:bg-cork-700 disabled:opacity-60';
const btnSecondary =
  'rounded-full border border-cork-400 px-4 py-2 text-sm font-medium text-cork-800 hover:bg-cork-100';

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T; status: number }> {
  const res = await fetch(url, { credentials: 'same-origin', ...init });
  const data = (await res.json()) as T;
  return { ok: res.ok, data, status: res.status };
}

export default function AdminPanel(props: Props) {
  const [tab, setTab] = createSignal<Tab>('users');
  const [users, setUsers] = createSignal<PublicUser[]>([]);
  const [products, setProducts] = createSignal<PublicProduct[]>([]);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(true);

  const [editingUserId, setEditingUserId] = createSignal<number | null>(null);
  const [uUsername, setUUsername] = createSignal('');
  const [uEmail, setUEmail] = createSignal('');
  const [uRole, setURole] = createSignal<'user' | 'admin'>('user');
  const [uDisplayName, setUDisplayName] = createSignal('');
  const [uBio, setUBio] = createSignal('');
  const [uBalance, setUBalance] = createSignal('0.00');
  const [uAdjust, setUAdjust] = createSignal('');

  const [editingProductId, setEditingProductId] = createSignal<number | 'new' | null>(null);
  const [pSlug, setPSlug] = createSignal('');
  const [pName, setPName] = createSignal('');
  const [pDescription, setPDescription] = createSignal('');
  const [pCategory, setPCategory] = createSignal('yoga-mat');
  const [pPrice, setPPrice] = createSignal('0.00');
  const [pImageUrl, setPImageUrl] = createSignal('');
  const [pInStock, setPInStock] = createSignal(true);

  const [csvFile, setCsvFile] = createSignal<File | null>(null);
  const [csvImporting, setCsvImporting] = createSignal(false);
  const [csvImportErrors, setCsvImportErrors] = createSignal<
    { row: number; slug: string; message: string }[]
  >([]);

  async function refreshUsers() {
    const { ok, data } = await api<{ users: PublicUser[] }>('/api/admin/users');
    if (ok) setUsers(data.users);
  }

  async function refreshProducts() {
    const { ok, data } = await api<{ products: PublicProduct[] }>('/api/admin/products');
    if (ok) setProducts(data.products);
  }

  async function refreshAll() {
    setLoading(true);
    setError('');
    await Promise.all([refreshUsers(), refreshProducts()]);
    setLoading(false);
  }

  createEffect(() => {
    refreshAll();
  });

  function selectUser(u: PublicUser) {
    setEditingUserId(u.id);
    setUUsername(u.username);
    setUEmail(u.email);
    setURole(u.role);
    setUDisplayName(u.displayName ?? '');
    setUBio(u.bio ?? '');
    setUBalance(centsToDollars(u.balanceCents));
    setUAdjust('');
    setMessage('');
    setError('');
  }

  function resetProductForm() {
    setEditingProductId('new');
    setPSlug('');
    setPName('');
    setPDescription('');
    setPCategory('yoga-mat');
    setPPrice('0.00');
    setPImageUrl('');
    setPInStock(true);
    setMessage('');
    setError('');
  }

  function selectProduct(p: PublicProduct) {
    setEditingProductId(p.id);
    setPSlug(p.slug);
    setPName(p.name);
    setPDescription(p.description);
    setPCategory(p.category);
    setPPrice(centsToDollars(p.priceCents));
    setPImageUrl(p.imageUrl ?? '');
    setPInStock(p.inStock);
    setMessage('');
    setError('');
  }

  async function saveUser() {
    const id = editingUserId();
    if (!id) return;

    setError('');
    setMessage('');

    const balanceCents = dollarsToCents(uBalance());
    if (Number.isNaN(balanceCents) || balanceCents < 0) {
      setError('Enter a valid balance amount.');
      return;
    }

    const body: Record<string, unknown> = {
      username: uUsername(),
      email: uEmail(),
      role: uRole(),
      displayName: uDisplayName(),
      bio: uBio(),
      balanceCents,
    };

    const adjustStr = uAdjust().trim();
    if (adjustStr) {
      const adjustCents = dollarsToCents(adjustStr);
      if (Number.isNaN(adjustCents)) {
        setError('Enter a valid adjustment amount (use negative to deduct).');
        return;
      }
      delete body.balanceCents;
      body.balanceAdjustmentCents = adjustCents;
    }

    const { ok, data } = await api<{ user?: PublicUser; error?: string; errors?: Record<string, string> }>(
      `/api/admin/users/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!ok) {
      const d = data as { error?: string; errors?: Record<string, string> };
      setError(d.error ?? Object.values(d.errors ?? {})[0] ?? 'Save failed.');
      return;
    }

    setMessage('User updated.');
    setUAdjust('');
    await refreshUsers();
    if (data.user) selectUser(data.user);
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user permanently?')) return;
    const { ok, data } = await api<{ error?: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    if (!ok) {
      setError(data.error ?? 'Delete failed.');
      return;
    }
    setEditingUserId(null);
    setMessage('User deleted.');
    await refreshUsers();
  }

  async function saveProduct() {
    const mode = editingProductId();
    if (mode === null) return;

    const priceCents = dollarsToCents(pPrice());
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError('Enter a valid price.');
      return;
    }

    const payload = {
      slug: pSlug().trim().toLowerCase(),
      name: pName(),
      description: pDescription(),
      category: pCategory(),
      priceCents,
      imageUrl: pImageUrl().trim() || null,
      inStock: pInStock(),
    };

    setError('');
    setMessage('');

    if (mode === 'new') {
      const { ok, data } = await api<{ product?: PublicProduct; error?: string; errors?: Record<string, string> }>(
        '/api/admin/products',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!ok) {
        const d = data as { error?: string; errors?: Record<string, string> };
        setError(d.error ?? Object.values(d.errors ?? {})[0] ?? 'Create failed.');
        return;
      }
      setMessage('Product created.');
      await refreshProducts();
      if (data.product) selectProduct(data.product);
    } else {
      const { ok, data } = await api<{ product?: PublicProduct; error?: string; errors?: Record<string, string> }>(
        `/api/admin/products/${mode}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!ok) {
        const d = data as { error?: string; errors?: Record<string, string> };
        setError(d.error ?? Object.values(d.errors ?? {})[0] ?? 'Update failed.');
        return;
      }
      setMessage('Product updated.');
      await refreshProducts();
      if (data.product) selectProduct(data.product);
    }
  }

  async function importProductsCsv() {
    const file = csvFile();
    if (!file) {
      setError('Choose a CSV file to import.');
      return;
    }

    setCsvImporting(true);
    setError('');
    setMessage('');
    setCsvImportErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      const data = (await res.json()) as {
        error?: string;
        created?: number;
        failed?: number;
        errors?: { row: number; slug: string; message: string }[];
      };

      if (!res.ok) {
        setError(data.error ?? 'Import failed.');
        return;
      }

      if (data.errors?.length) {
        setCsvImportErrors(data.errors);
      }

      const created = data.created ?? 0;
      const failed = data.failed ?? 0;
      if (created > 0) {
        setMessage(
          failed > 0
            ? `Imported ${created} product(s). ${failed} row(s) had errors.`
            : `Imported ${created} product(s) successfully.`,
        );
        await refreshProducts();
        setCsvFile(null);
      } else if (failed > 0) {
        setError('No products were imported. Fix the errors below and try again.');
      }
    } catch {
      setError('Could not upload CSV. Please try again.');
    } finally {
      setCsvImporting(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return;
    const { ok, data } = await api<{ error?: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
    if (!ok) {
      setError(data.error ?? 'Delete failed.');
      return;
    }
    setEditingProductId(null);
    setMessage('Product deleted.');
    await refreshProducts();
  }

  const tabClass = (t: Tab) =>
    tab() === t
      ? 'border-b-2 border-cork-800 pb-2 text-sm font-medium text-cork-900'
      : 'pb-2 text-sm font-medium text-cork-500 hover:text-cork-800';

  return (
    <div class="space-y-6">
      <Show when={message()}>
        <p class="rounded-lg border border-sage-500/30 bg-sage-400/10 px-4 py-3 text-sm text-cork-800">
          {message()}
        </p>
      </Show>
      <Show when={error()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error()}
        </p>
      </Show>

      <nav class="flex gap-6 border-b border-cork-200">
        <button type="button" class={tabClass('users')} onClick={() => setTab('users')}>
          Users ({users().length})
        </button>
        <button type="button" class={tabClass('products')} onClick={() => setTab('products')}>
          Products ({products().length})
        </button>
        <button type="button" class={tabClass('logs')} onClick={() => setTab('logs')}>
          System log
        </button>
      </nav>

      <Show when={loading()}>
        <p class="text-sm text-cork-500">Loading…</p>
      </Show>

      <Show when={!loading() && tab() === 'users'}>
        <div class="grid gap-8 lg:grid-cols-5">
          <div class="lg:col-span-3 overflow-x-auto rounded-2xl border border-cork-200 bg-white">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-cork-200 bg-cork-50">
                <tr>
                  <th class="px-4 py-3 font-medium">User</th>
                  <th class="px-4 py-3 font-medium">Role</th>
                  <th class="px-4 py-3 font-medium">Balance</th>
                  <th class="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                <For each={users()}>
                  {(u) => (
                    <tr class="border-b border-cork-100 last:border-0">
                      <td class="px-4 py-3">
                        <div class="font-medium">{u.displayName ?? u.username}</div>
                        <div class="text-xs text-cork-500">{u.email}</div>
                      </td>
                      <td class="px-4 py-3 capitalize">{u.role}</td>
                      <td class="px-4 py-3">{formatPrice(u.balanceCents)}</td>
                      <td class="px-4 py-3 text-right">
                        <button type="button" class={btnSecondary} onClick={() => selectUser(u)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <div class="lg:col-span-2 rounded-2xl border border-cork-200 bg-cork-50/50 p-5">
            <Show
              when={editingUserId()}
              fallback={
                <p class="text-sm text-cork-500">Select a user to view or edit their record.</p>
              }
            >
              <h2 class="font-serif text-lg text-cork-900">Edit user</h2>
              <div class="mt-4 space-y-3">
                <div>
                  <label class="text-xs font-medium text-cork-700">Username</label>
                  <input class={inputClass} value={uUsername()} onInput={(e) => setUUsername(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Email</label>
                  <input class={inputClass} type="email" value={uEmail()} onInput={(e) => setUEmail(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Role</label>
                  <select class={inputClass} value={uRole()} onChange={(e) => setURole(e.currentTarget.value as 'user' | 'admin')}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Display name</label>
                  <input class={inputClass} value={uDisplayName()} onInput={(e) => setUDisplayName(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Bio</label>
                  <textarea class={inputClass} rows={2} value={uBio()} onInput={(e) => setUBio(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Balance (USD)</label>
                  <input class={inputClass} type="number" step="0.01" min="0" value={uBalance()} onInput={(e) => setUBalance(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Adjust balance (USD, optional)</label>
                  <input
                    class={inputClass}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10.00 or -5.00"
                    value={uAdjust()}
                    onInput={(e) => setUAdjust(e.currentTarget.value)}
                  />
                  <p class="mt-1 text-xs text-cork-500">Adds to current balance instead of setting it.</p>
                </div>
                <div class="flex flex-wrap gap-2 pt-2">
                  <button type="button" class={btnPrimary} onClick={saveUser}>
                    Save user
                  </button>
                  <Show when={editingUserId() !== props.currentAdminId}>
                    <button
                      type="button"
                      class="rounded-full border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-50"
                      onClick={() => deleteUser(editingUserId()!)}
                    >
                      Delete
                    </button>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={!loading() && tab() === 'products'}>
        <div class="flex flex-wrap items-center justify-end gap-3">
          <button type="button" class={btnPrimary} onClick={resetProductForm}>
            + New product
          </button>
        </div>

        <section class="rounded-2xl border border-cork-200 bg-cork-50/60 p-5">
          <h2 class="font-serif text-lg text-cork-900">Import products from CSV</h2>
          <p class="mt-2 text-sm text-cork-600">
            Upload a comma-separated file to create multiple products at once. Required columns:{' '}
            <span class="font-mono text-xs">slug</span>,{' '}
            <span class="font-mono text-xs">name</span>,{' '}
            <span class="font-mono text-xs">description</span>,{' '}
            <span class="font-mono text-xs">category</span>, and either{' '}
            <span class="font-mono text-xs">price_usd</span> or{' '}
            <span class="font-mono text-xs">price_cents</span>. Optional:{' '}
            <span class="font-mono text-xs">image_url</span>,{' '}
            <span class="font-mono text-xs">in_stock</span> (true/false). Categories:{' '}
            <span class="font-mono text-xs">yoga-mat</span> or{' '}
            <span class="font-mono text-xs">cushion</span>.
          </p>
          <p class="mt-2 text-sm">
            <a
              href="/samples/products-import-sample.csv"
              class="font-medium text-cork-800 underline hover:text-cork-600"
              download
            >
              Download sample CSV
            </a>
          </p>
          <div class="mt-4 flex flex-wrap items-end gap-3">
            <div class="min-w-[12rem] flex-1">
              <label for="csv-import" class="text-xs font-medium text-cork-700">
                CSV file
              </label>
              <input
                id="csv-import"
                type="file"
                accept=".csv,text/csv"
                class={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-cork-200 file:px-3 file:py-1 file:text-sm file:text-cork-800`}
                onChange={(e) => setCsvFile(e.currentTarget.files?.[0] ?? null)}
              />
            </div>
            <button
              type="button"
              class={btnPrimary}
              disabled={csvImporting() || !csvFile()}
              onClick={importProductsCsv}
            >
              {csvImporting() ? 'Importing…' : 'Import CSV'}
            </button>
          </div>
          <Show when={csvImportErrors().length > 0}>
            <div class="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-amber-50/80">
              <table class="w-full text-left text-sm">
                <thead class="border-b border-amber-200">
                  <tr>
                    <th class="px-3 py-2 font-medium">Row</th>
                    <th class="px-3 py-2 font-medium">Slug</th>
                    <th class="px-3 py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={csvImportErrors()}>
                    {(err) => (
                      <tr class="border-b border-amber-100 last:border-0">
                        <td class="px-3 py-2">{err.row || '—'}</td>
                        <td class="px-3 py-2 font-mono text-xs">{err.slug || '—'}</td>
                        <td class="px-3 py-2 text-cork-800">{err.message}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </section>

        <div class="grid gap-8 lg:grid-cols-5">
          <div class="lg:col-span-3 overflow-x-auto rounded-2xl border border-cork-200 bg-white">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-cork-200 bg-cork-50">
                <tr>
                  <th class="px-4 py-3 font-medium">Product</th>
                  <th class="px-4 py-3 font-medium">Category</th>
                  <th class="px-4 py-3 font-medium">Price</th>
                  <th class="px-4 py-3 font-medium">Stock</th>
                  <th class="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                <For each={products()}>
                  {(p) => (
                    <tr class="border-b border-cork-100 last:border-0">
                      <td class="px-4 py-3">
                        <div class="font-medium">{p.name}</div>
                        <div class="text-xs text-cork-500">{p.slug}</div>
                      </td>
                      <td class="px-4 py-3">{p.category.replace('-', ' ')}</td>
                      <td class="px-4 py-3">{formatPrice(p.priceCents)}</td>
                      <td class="px-4 py-3">{p.inStock ? 'In stock' : 'Out'}</td>
                      <td class="px-4 py-3 text-right">
                        <button type="button" class={btnSecondary} onClick={() => selectProduct(p)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <div class="lg:col-span-2 rounded-2xl border border-cork-200 bg-cork-50/50 p-5">
            <Show
              when={editingProductId()}
              fallback={
                <p class="text-sm text-cork-500">Select a product or create a new one.</p>
              }
            >
              <h2 class="font-serif text-lg text-cork-900">
                {editingProductId() === 'new' ? 'New product' : 'Edit product'}
              </h2>
              <div class="mt-4 space-y-3">
                <div>
                  <label class="text-xs font-medium text-cork-700">Slug</label>
                  <input class={inputClass} value={pSlug()} onInput={(e) => setPSlug(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Name</label>
                  <input class={inputClass} value={pName()} onInput={(e) => setPName(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Description</label>
                  <textarea class={inputClass} rows={3} value={pDescription()} onInput={(e) => setPDescription(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Category</label>
                  <select class={inputClass} value={pCategory()} onChange={(e) => setPCategory(e.currentTarget.value)}>
                    <option value="yoga-mat">Yoga mat</option>
                    <option value="cushion">Cushion</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Price (USD)</label>
                  <input class={inputClass} type="number" step="0.01" min="0" value={pPrice()} onInput={(e) => setPPrice(e.currentTarget.value)} />
                </div>
                <div>
                  <label class="text-xs font-medium text-cork-700">Image URL</label>
                  <input class={inputClass} type="url" value={pImageUrl()} onInput={(e) => setPImageUrl(e.currentTarget.value)} />
                </div>
                <label class="flex items-center gap-2 text-sm text-cork-800">
                  <input type="checkbox" checked={pInStock()} onChange={(e) => setPInStock(e.currentTarget.checked)} />
                  In stock
                </label>
                <div class="flex flex-wrap gap-2 pt-2">
                  <button type="button" class={btnPrimary} onClick={saveProduct}>
                    {editingProductId() === 'new' ? 'Create product' : 'Save product'}
                  </button>
                  <Show when={editingProductId() !== 'new'}>
                    <button
                      type="button"
                      class="rounded-full border border-red-300 px-4 py-2 text-sm text-red-800 hover:bg-red-50"
                      onClick={() => deleteProduct(editingProductId() as number)}
                    >
                      Delete
                    </button>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={tab() === 'logs'}>
        <AdminSystemLogs />
      </Show>
    </div>
  );
}
