import { createSignal, For, Show } from 'solid-js';
import ProductCsvImport from '@/components/solid/ProductCsvImport';
import SystemLogPanel from '@/components/solid/SystemLogPanel';
import type { PublicUser } from '@/lib/auth/types';
import type { ProductDTO } from '@/lib/types';
import type { UserRole } from '@/db/schema';

interface Category {
  id: string;
  name: string;
  slug: string;
}

type Tab = 'users' | 'products' | 'logs';

interface UserFormState {
  displayName: string;
  email: string;
  bio: string;
  role: UserRole;
  balance: string;
  balanceDelta: string;
}

interface ProductFormState {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image: string;
  badge: string;
  featured: boolean;
}

const emptyProductForm = (categories: Category[]): ProductFormState => ({
  id: '',
  categoryId: categories[0]?.id ?? '',
  name: '',
  slug: '',
  description: '',
  price: '',
  image: '/images/whisperpure-mini.svg',
  badge: '',
  featured: false,
});

export default function AdminPanel() {
  const [tab, setTab] = createSignal<Tab>('users');
  const [users, setUsers] = createSignal<PublicUser[]>([]);
  const [products, setProducts] = createSignal<ProductDTO[]>([]);
  const [categories, setCategories] = createSignal<Category[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [editingUserId, setEditingUserId] = createSignal<string | null>(null);
  const [userForm, setUserForm] = createSignal<UserFormState | null>(null);

  const [editingProduct, setEditingProduct] = createSignal(false);
  const [productForm, setProductForm] = createSignal<ProductFormState | null>(null);

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage(null);
    } else {
      setMessage(msg);
      setError(null);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      const usersJson = await usersRes.json();
      const productsJson = await productsRes.json();
      const categoriesJson = await categoriesRes.json();

      if (!usersRes.ok) throw new Error(usersJson.error ?? 'Failed to load users.');
      if (!productsRes.ok) throw new Error(productsJson.error ?? 'Failed to load products.');
      if (!categoriesRes.ok) throw new Error(categoriesJson.error ?? 'Failed to load categories.');

      setUsers(usersJson.users);
      setProducts(productsJson.products);
      setCategories(categoriesJson.categories);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to load admin data.', true);
    } finally {
      setLoading(false);
    }
  };

  loadAll();

  const openUserEdit = (user: PublicUser) => {
    setEditingUserId(user.id);
    setUserForm({
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      role: user.role,
      balance: user.balance.toFixed(2),
      balanceDelta: '',
    });
    setError(null);
    setMessage(null);
  };

  const saveUser = async () => {
    const id = editingUserId();
    const form = userForm();
    if (!id || !form) return;

    setLoading(true);
    const payload: Record<string, unknown> = {
      displayName: form.displayName,
      email: form.email,
      bio: form.bio,
      role: form.role,
    };

    const delta = parseFloat(form.balanceDelta);
    if (form.balanceDelta.trim() !== '' && !Number.isNaN(delta)) {
      payload.balanceDelta = delta;
    } else {
      const balance = parseFloat(form.balance);
      if (!Number.isNaN(balance)) payload.balance = balance;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Update failed.');
      setUsers((list) => list.map((u) => (u.id === id ? json.user : u)));
      setEditingUserId(null);
      setUserForm(null);
      flash('User updated.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Update failed.', true);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user permanently?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed.');
      setUsers((list) => list.filter((u) => u.id !== id));
      flash('User deleted.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Delete failed.', true);
    } finally {
      setLoading(false);
    }
  };

  const openNewProduct = () => {
    setEditingProduct(true);
    setProductForm(emptyProductForm(categories()));
  };

  const openProductEdit = (product: ProductDTO) => {
    setEditingProduct(true);
    setProductForm({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toFixed(2),
      image: product.image,
      badge: product.badge ?? '',
      featured: product.featured,
    });
  };

  const saveProduct = async () => {
    const form = productForm();
    if (!form) return;

    setLoading(true);
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: parseFloat(form.price),
      image: form.image,
      badge: form.badge || null,
      featured: form.featured,
    };

    try {
      const isNew = !form.id;
      const res = await fetch(
        isNew ? '/api/admin/products' : `/api/admin/products/${form.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed.');

      if (isNew) {
        setProducts((list) => [...list, json.product]);
      } else {
        setProducts((list) =>
          list.map((p) => (p.id === form.id ? json.product : p)),
        );
      }
      setEditingProduct(false);
      setProductForm(null);
      flash(isNew ? 'Product created.' : 'Product updated.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Save failed.', true);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed.');
      setProducts((list) => list.filter((p) => p.id !== id));
      flash('Product deleted.');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Delete failed.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setTab('users')}
          class:list={[
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            tab() === 'users'
              ? 'bg-volt-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white',
          ]}
        >
          Users ({users().length})
        </button>
        <button
          type="button"
          onClick={() => setTab('products')}
          class:list={[
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            tab() === 'products'
              ? 'bg-volt-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white',
          ]}
        >
          Products ({products().length})
        </button>
        <button
          type="button"
          onClick={() => setTab('logs')}
          class:list={[
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            tab() === 'logs'
              ? 'bg-volt-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white',
          ]}
        >
          System log
        </button>
      </div>

      <Show when={message()}>
        <p class="rounded-lg border border-stream-500/30 bg-stream-500/10 px-4 py-3 text-sm text-stream-300">
          {message()}
        </p>
      </Show>
      <Show when={error()}>
        <p class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error()}
        </p>
      </Show>

      <Show when={loading() && users().length === 0}>
        <p class="text-slate-400">Loading…</p>
      </Show>

      <Show when={tab() === 'users'}>
        <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="border-b border-white/10 bg-slate-900/80 text-slate-400">
              <tr>
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Balance</th>
                <th class="px-4 py-3 font-medium">Role</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <For each={users()}>
                {(user) => (
                  <tr class="hover:bg-white/5">
                    <td class="px-4 py-3">
                      <p class="font-medium text-white">{user.displayName}</p>
                      <p class="text-xs text-slate-500">
                        @{user.username} · {user.email}
                      </p>
                    </td>
                    <td class="px-4 py-3 font-mono text-stream-400">
                      ${user.balance.toFixed(2)}
                    </td>
                    <td class="px-4 py-3 capitalize text-slate-300">{user.role}</td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openUserEdit(user)}
                        class="mr-2 text-volt-400 hover:text-volt-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        class="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={editingUserId() && userForm()}>
          {(form) => (
            <form
              class="rounded-2xl border border-volt-500/30 bg-slate-900/80 p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveUser();
              }}
            >
              <h3 class="text-lg font-semibold text-white">Edit user</h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Display name</label>
                  <input
                    type="text"
                    value={form().displayName}
                    onInput={(e) =>
                      setUserForm((f) => f && { ...f, displayName: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Email</label>
                  <input
                    type="email"
                    value={form().email}
                    onInput={(e) =>
                      setUserForm((f) => f && { ...f, email: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Role</label>
                  <select
                    value={form().role}
                    onChange={(e) =>
                      setUserForm(
                        (f) => f && { ...f, role: e.currentTarget.value as UserRole },
                      )
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Set balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form().balance}
                    onInput={(e) =>
                      setUserForm((f) => f && { ...f, balance: e.currentTarget.value, balanceDelta: '' })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs text-slate-400">
                    Adjust balance (+/- $) — overrides set balance if filled
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25 or -10"
                    value={form().balanceDelta}
                    onInput={(e) =>
                      setUserForm((f) => f && { ...f, balanceDelta: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs text-slate-400">Bio</label>
                  <textarea
                    rows={2}
                    value={form().bio}
                    onInput={(e) =>
                      setUserForm((f) => f && { ...f, bio: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  type="submit"
                  disabled={loading()}
                  class="rounded-full bg-volt-600 px-5 py-2 text-sm font-medium text-white hover:bg-volt-500 disabled:opacity-60"
                >
                  Save user
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUserId(null);
                    setUserForm(null);
                  }}
                  class="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Show>
      </Show>

      <Show when={tab() === 'products'}>
        <div class="flex justify-end">
          <button
            type="button"
            onClick={openNewProduct}
            class="rounded-full bg-volt-600 px-4 py-2 text-sm font-medium text-white hover:bg-volt-500"
          >
            + New product
          </button>
        </div>

        <ProductCsvImport
          categories={categories()}
          onImported={(imported) =>
            setProducts((list) => [...list, ...imported])
          }
          onFlash={flash}
        />

        <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-white/10 bg-slate-900/80 text-slate-400">
              <tr>
                <th class="px-4 py-3 font-medium">Product</th>
                <th class="px-4 py-3 font-medium">Category</th>
                <th class="px-4 py-3 font-medium">Price</th>
                <th class="px-4 py-3 font-medium">Featured</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <For each={products()}>
                {(product) => (
                  <tr class="hover:bg-white/5">
                    <td class="px-4 py-3">
                      <p class="font-medium text-white">{product.name}</p>
                      <p class="text-xs text-slate-500">{product.slug}</p>
                    </td>
                    <td class="px-4 py-3 text-slate-400">{product.categoryName}</td>
                    <td class="px-4 py-3 font-mono text-white">
                      ${product.price.toFixed(2)}
                    </td>
                    <td class="px-4 py-3">
                      {product.featured ? (
                        <span class="text-stream-400">Yes</span>
                      ) : (
                        <span class="text-slate-500">No</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openProductEdit(product)}
                        class="mr-2 text-volt-400 hover:text-volt-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                        class="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={editingProduct() && productForm()}>
          {(form) => (
            <form
              class="rounded-2xl border border-volt-500/30 bg-slate-900/80 p-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveProduct();
              }}
            >
              <h3 class="text-lg font-semibold text-white">
                {form().id ? 'Edit product' : 'New product'}
              </h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Name</label>
                  <input
                    type="text"
                    required
                    value={form().name}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, name: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Slug (optional)</label>
                  <input
                    type="text"
                    value={form().slug}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, slug: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Category</label>
                  <select
                    value={form().categoryId}
                    onChange={(e) =>
                      setProductForm((f) => f && { ...f, categoryId: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  >
                    <For each={categories()}>
                      {(cat) => <option value={cat.id}>{cat.name}</option>}
                    </For>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form().price}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, price: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs text-slate-400">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={form().description}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, description: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="mb-1 block text-xs text-slate-400">Image path</label>
                  <input
                    type="text"
                    required
                    value={form().image}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, image: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">Badge (optional)</label>
                  <input
                    type="text"
                    value={form().badge}
                    onInput={(e) =>
                      setProductForm((f) => f && { ...f, badge: e.currentTarget.value })
                    }
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div class="flex items-end">
                  <label class="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form().featured}
                      onChange={(e) =>
                        setProductForm(
                          (f) => f && { ...f, featured: e.currentTarget.checked },
                        )
                      }
                      class="rounded border-white/20"
                    />
                    Featured on homepage
                  </label>
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  type="submit"
                  disabled={loading()}
                  class="rounded-full bg-volt-600 px-5 py-2 text-sm font-medium text-white hover:bg-volt-500 disabled:opacity-60"
                >
                  {form().id ? 'Save product' : 'Create product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(false);
                    setProductForm(null);
                  }}
                  class="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Show>
      </Show>

      <Show when={tab() === 'logs'}>
        <SystemLogPanel />
      </Show>
    </div>
  );
}
