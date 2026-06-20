import { createSignal, For, onMount, Show } from 'solid-js';
import { PRODUCT_CATEGORIES } from '../../lib/auth/product-validation';
import { ROLES } from '../../lib/auth/constants';
import SystemLogViewer from './SystemLogViewer';
import ProductCsvImport from './ProductCsvImport';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  category: string;
  image: string;
  featured: boolean;
}

interface Props {
  initialUsers: User[];
  initialProducts: Product[];
  currentAdminId: number;
}

type Tab = 'users' | 'products' | 'logs';

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function centsFromDollars(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

const emptyProduct = (): Omit<Product, 'id'> => ({
  name: '',
  slug: '',
  description: '',
  priceCents: 0,
  category: PRODUCT_CATEGORIES[0],
  image: '/images/products/placeholder.svg',
  featured: false,
});

export default function AdminPanel(props: Props) {
  const [tab, setTab] = createSignal<Tab>('users');

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'logs') setTab('logs');
  });
  const [users, setUsers] = createSignal<User[]>(props.initialUsers);
  const [products, setProducts] = createSignal<Product[]>(props.initialProducts);
  const [message, setMessage] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = createSignal(false);

  const [editingUserId, setEditingUserId] = createSignal<number | null>(null);
  const [userEmail, setUserEmail] = createSignal('');
  const [userDisplayName, setUserDisplayName] = createSignal('');
  const [userRole, setUserRole] = createSignal('user');
  const [balanceDollars, setBalanceDollars] = createSignal('');
  const [balanceAdjust, setBalanceAdjust] = createSignal('');

  const [editingProductId, setEditingProductId] = createSignal<number | 'new' | null>(null);
  const [productName, setProductName] = createSignal('');
  const [productSlug, setProductSlug] = createSignal('');
  const [productDescription, setProductDescription] = createSignal('');
  const [productPrice, setProductPrice] = createSignal('');
  const [productCategory, setProductCategory] = createSignal(PRODUCT_CATEGORIES[0]);
  const [productImage, setProductImage] = createSignal('');
  const [productFeatured, setProductFeatured] = createSignal(false);

  function showOk(text: string) {
    setMessage({ type: 'ok', text });
  }

  function showErr(text: string) {
    setMessage({ type: 'err', text });
  }

  async function refreshUsers() {
    const res = await fetch('/api/admin/users');
    const json = await res.json();
    if (res.ok) setUsers(json.users);
  }

  async function refreshProducts() {
    const res = await fetch('/api/admin/products');
    const json = await res.json();
    if (res.ok) setProducts(json.products);
  }

  function startEditUser(user: User) {
    setEditingUserId(user.id);
    setUserEmail(user.email);
    setUserDisplayName(user.displayName);
    setUserRole(user.role);
    setBalanceDollars((user.balanceCents / 100).toFixed(2));
    setBalanceAdjust('');
    setMessage(null);
  }

  function startNewProduct() {
    const blank = emptyProduct();
    setEditingProductId('new');
    setProductName(blank.name);
    setProductSlug(blank.slug);
    setProductDescription(blank.description);
    setProductPrice('');
    setProductCategory(blank.category);
    setProductImage(blank.image);
    setProductFeatured(blank.featured);
    setTab('products');
    setMessage(null);
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductSlug(product.slug);
    setProductDescription(product.description);
    setProductPrice((product.priceCents / 100).toFixed(2));
    setProductCategory(product.category);
    setProductImage(product.image);
    setProductFeatured(product.featured);
    setMessage(null);
  }

  async function saveUser(e: Event) {
    e.preventDefault();
    const id = editingUserId();
    if (!id) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail(),
          displayName: userDisplayName(),
          role: userRole(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showErr(json.error ?? 'Failed to update user.');
        return;
      }

      const balanceCents = centsFromDollars(balanceDollars());
      if (balanceCents === null) {
        showErr('Enter a valid balance amount.');
        return;
      }

      const current = users().find((u) => u.id === id);
      if (current && current.balanceCents !== balanceCents) {
        const balRes = await fetch(`/api/admin/users/${id}/balance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ balanceCents }),
        });
        const balJson = await balRes.json();
        if (!balRes.ok) {
          showErr(balJson.error ?? 'User saved but balance update failed.');
          await refreshUsers();
          return;
        }
        json.user = balJson.user;
      }

      const adjust = balanceAdjust().trim();
      if (adjust) {
        const isNegative = adjust.startsWith('-');
        const numeric = adjust.replace(/^[-+]/, '');
        const adjustCents = centsFromDollars(numeric);
        if (adjustCents === null) {
          showErr('Enter a valid adjustment amount.');
          return;
        }
        const balRes = await fetch(`/api/admin/users/${id}/balance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adjustCents: (isNegative ? -1 : 1) * adjustCents,
          }),
        });
        const balJson = await balRes.json();
        if (!balRes.ok) {
          showErr(balJson.error ?? 'Adjustment failed.');
          await refreshUsers();
          return;
        }
      }

      await refreshUsers();
      setEditingUserId(null);
      showOk('User updated successfully.');
    } catch {
      showErr('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteUserAccount(id: number) {
    if (id === props.currentAdminId) {
      showErr('You cannot delete your own account.');
      return;
    }
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        showErr(json.error ?? 'Delete failed.');
        return;
      }
      await refreshUsers();
      setEditingUserId(null);
      showOk('User deleted.');
    } catch {
      showErr('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(e: Event) {
    e.preventDefault();
    const priceCents = centsFromDollars(productPrice());
    if (priceCents === null) {
      showErr('Enter a valid price.');
      return;
    }

    const payload = {
      name: productName(),
      slug: productSlug(),
      description: productDescription(),
      priceCents,
      category: productCategory(),
      image: productImage(),
      featured: productFeatured(),
    };

    const editId = editingProductId();
    setLoading(true);
    setMessage(null);
    try {
      const res =
        editId === 'new'
          ? await fetch('/api/admin/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/products/${editId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

      const json = await res.json();
      if (!res.ok) {
        showErr(json.error ?? 'Failed to save product.');
        return;
      }

      await refreshProducts();
      setEditingProductId(null);
      showOk(editId === 'new' ? 'Product created.' : 'Product updated.');
    } catch {
      showErr('Network error.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProductById(id: number) {
    if (!confirm('Delete this product permanently?')) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        showErr(json.error ?? 'Delete failed.');
        return;
      }
      await refreshProducts();
      setEditingProductId(null);
      showOk('Product deleted.');
    } catch {
      showErr('Network error.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-nest-900 px-3 py-2 text-sm text-white placeholder:text-nest-100/40 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30';

  return (
    <div class="space-y-8">
      <div>
        <p class="text-sm font-medium text-accent">Administrator</p>
        <h1 class="font-display text-3xl font-bold text-white">Admin panel</h1>
        <p class="mt-2 text-nest-100/60">
          Manage users, products, and monitor internal system events.
        </p>
      </div>

      <Show when={message()}>
        <div
          class:list={[
            'rounded-lg border px-4 py-3 text-sm',
            message()!.type === 'ok'
              ? 'border-accent/30 bg-accent/10 text-accent'
              : 'border-red-500/30 bg-red-500/10 text-red-300',
          ]}
        >
          {message()!.text}
        </div>
      </Show>

      <div class="flex gap-2 border-b border-white/10">
        <button
          type="button"
          class:list={[
            'px-4 py-2 text-sm font-medium transition',
            tab() === 'users'
              ? 'border-b-2 border-accent text-accent'
              : 'text-nest-100/60 hover:text-white',
          ]}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          class:list={[
            'px-4 py-2 text-sm font-medium transition',
            tab() === 'products'
              ? 'border-b-2 border-accent text-accent'
              : 'text-nest-100/60 hover:text-white',
          ]}
          onClick={() => setTab('products')}
        >
          Products
        </button>
        <button
          type="button"
          class:list={[
            'px-4 py-2 text-sm font-medium transition',
            tab() === 'logs'
              ? 'border-b-2 border-accent text-accent'
              : 'text-nest-100/60 hover:text-white',
          ]}
          onClick={() => setTab('logs')}
        >
          System log
        </button>
      </div>

      <Show when={tab() === 'users'}>
        <div class="overflow-hidden rounded-2xl border border-white/10">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 bg-nest-900/80 text-nest-100/70">
              <tr>
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Balance</th>
                <th class="px-4 py-3 font-medium">Role</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <For each={users()}>
                {(u) => (
                  <tr class="bg-nest-900/30">
                    <td class="px-4 py-3">
                      <p class="font-medium text-white">{u.displayName}</p>
                      <p class="text-nest-100/50">@{u.username}</p>
                      <p class="text-nest-100/50">{u.email}</p>
                    </td>
                    <td class="px-4 py-3 text-nest-100/80">{formatMoney(u.balanceCents)}</td>
                    <td class="px-4 py-3">
                      <span
                        class:list={[
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          u.role === ROLES.ADMIN
                            ? 'bg-glow/20 text-glow'
                            : 'bg-nest-800 text-nest-100/70',
                        ]}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        class="text-accent hover:underline"
                        onClick={() => startEditUser(u)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={editingUserId() !== null}>
          <form
            onSubmit={saveUser}
            class="space-y-4 rounded-2xl border border-white/10 bg-nest-900/50 p-6"
          >
            <h2 class="font-display text-lg font-semibold text-white">Edit user</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Email</span>
                <input
                  type="email"
                  class={inputClass}
                  value={userEmail()}
                  onInput={(e) => setUserEmail(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Display name</span>
                <input
                  type="text"
                  class={inputClass}
                  value={userDisplayName()}
                  onInput={(e) => setUserDisplayName(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Role</span>
                <select
                  class={inputClass}
                  value={userRole()}
                  onChange={(e) => setUserRole(e.currentTarget.value)}
                  disabled={editingUserId() === props.currentAdminId}
                >
                  <option value={ROLES.USER}>user</option>
                  <option value={ROLES.ADMIN}>admin</option>
                </select>
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Set balance (USD)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  class={inputClass}
                  value={balanceDollars()}
                  onInput={(e) => setBalanceDollars(e.currentTarget.value)}
                />
              </label>
              <label class="col-span-full block space-y-1 sm:col-span-2">
                <span class="text-sm text-nest-100/70">
                  Adjust balance (USD, use negative to subtract)
                </span>
                <input
                  type="text"
                  class={inputClass}
                  placeholder="e.g. 10.00 or -5.00"
                  value={balanceAdjust()}
                  onInput={(e) => setBalanceAdjust(e.currentTarget.value)}
                />
              </label>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading()}
                class="rounded-full bg-accent px-5 py-2 text-sm font-medium text-nest-950 transition hover:bg-accent/90 disabled:opacity-50"
              >
                {loading() ? 'Saving…' : 'Save user'}
              </button>
              <button
                type="button"
                class="rounded-full border border-white/20 px-5 py-2 text-sm text-nest-100/80 hover:border-white/40"
                onClick={() => setEditingUserId(null)}
              >
                Cancel
              </button>
              <Show when={editingUserId() !== props.currentAdminId}>
                <button
                  type="button"
                  class="rounded-full border border-red-500/40 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  onClick={() => deleteUserAccount(editingUserId()!)}
                  disabled={loading()}
                >
                  Delete user
                </button>
              </Show>
            </div>
          </form>
        </Show>
      </Show>

      <Show when={tab() === 'products'}>
        <ProductCsvImport
          onImported={async () => {
            await refreshProducts();
          }}
          onMessage={(type, text) => {
            if (type === 'ok') showOk(text);
            else showErr(text);
          }}
          setLoading={setLoading}
          loading={loading}
        />

        <div class="flex justify-end">
          <button
            type="button"
            class="rounded-full bg-accent px-5 py-2 text-sm font-medium text-nest-950 hover:bg-accent/90"
            onClick={startNewProduct}
          >
            Add product
          </button>
        </div>

        <div class="overflow-hidden rounded-2xl border border-white/10">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 bg-nest-900/80 text-nest-100/70">
              <tr>
                <th class="px-4 py-3 font-medium">Product</th>
                <th class="px-4 py-3 font-medium">Price</th>
                <th class="px-4 py-3 font-medium">Category</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <For each={products()}>
                {(p) => (
                  <tr class="bg-nest-900/30">
                    <td class="px-4 py-3">
                      <p class="font-medium text-white">{p.name}</p>
                      <p class="text-nest-100/50">{p.slug}</p>
                      <Show when={p.featured}>
                        <span class="mt-1 inline-flex rounded-full bg-glow/20 px-2 py-0.5 text-xs text-glow">
                          Featured
                        </span>
                      </Show>
                    </td>
                    <td class="px-4 py-3">{formatMoney(p.priceCents)}</td>
                    <td class="px-4 py-3 text-nest-100/70">{p.category}</td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        class="text-accent hover:underline"
                        onClick={() => startEditProduct(p)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={editingProductId() !== null}>
          <form
            onSubmit={saveProduct}
            class="space-y-4 rounded-2xl border border-white/10 bg-nest-900/50 p-6"
          >
            <h2 class="font-display text-lg font-semibold text-white">
              {editingProductId() === 'new' ? 'New product' : 'Edit product'}
            </h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block space-y-1 sm:col-span-2">
                <span class="text-sm text-nest-100/70">Name</span>
                <input
                  type="text"
                  class={inputClass}
                  value={productName()}
                  onInput={(e) => setProductName(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Slug</span>
                <input
                  type="text"
                  class={inputClass}
                  value={productSlug()}
                  onInput={(e) => setProductSlug(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Price (USD)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  class={inputClass}
                  value={productPrice()}
                  onInput={(e) => setProductPrice(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Category</span>
                <select
                  class={inputClass}
                  value={productCategory()}
                  onChange={(e) => setProductCategory(e.currentTarget.value)}
                >
                  <For each={[...PRODUCT_CATEGORIES]}>
                    {(cat) => <option value={cat}>{cat}</option>}
                  </For>
                </select>
              </label>
              <label class="block space-y-1">
                <span class="text-sm text-nest-100/70">Image path or URL</span>
                <input
                  type="text"
                  class={inputClass}
                  value={productImage()}
                  onInput={(e) => setProductImage(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="col-span-full block space-y-1 sm:col-span-2">
                <span class="text-sm text-nest-100/70">Description</span>
                <textarea
                  class={`${inputClass} min-h-[100px] resize-y`}
                  value={productDescription()}
                  onInput={(e) => setProductDescription(e.currentTarget.value)}
                  required
                />
              </label>
              <label class="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={productFeatured()}
                  onChange={(e) => setProductFeatured(e.currentTarget.checked)}
                  class="rounded border-white/20 bg-nest-900 text-accent focus:ring-accent/30"
                />
                <span class="text-sm text-nest-100/70">Featured on homepage</span>
              </label>
            </div>
            <div class="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading()}
                class="rounded-full bg-accent px-5 py-2 text-sm font-medium text-nest-950 hover:bg-accent/90 disabled:opacity-50"
              >
                {loading() ? 'Saving…' : 'Save product'}
              </button>
              <button
                type="button"
                class="rounded-full border border-white/20 px-5 py-2 text-sm text-nest-100/80"
                onClick={() => setEditingProductId(null)}
              >
                Cancel
              </button>
              <Show when={editingProductId() !== 'new' && editingProductId() !== null}>
                <button
                  type="button"
                  class="rounded-full border border-red-500/40 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
                  onClick={() => deleteProductById(editingProductId() as number)}
                  disabled={loading()}
                >
                  Delete product
                </button>
              </Show>
            </div>
          </form>
        </Show>
      </Show>

      <Show when={tab() === 'logs'}>
        <SystemLogViewer />
      </Show>

      <p class="text-sm text-nest-100/50">
        <a href="/profile" class="text-accent hover:underline">
          ← Back to profile
        </a>
      </p>
    </div>
  );
}
