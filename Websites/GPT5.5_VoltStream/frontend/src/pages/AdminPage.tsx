import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  fetchAdminUsers,
  updateAdminProduct,
  updateAdminUser,
  type AdminUser,
  type ProductCreate,
} from "../api/admin";
import { formatPrice } from "../api/products";
import { centsToDollars, dollarsToCents } from "../lib/money";
import AdminProductCsvImport from "../components/AdminProductCsvImport";
import AdminSystemLogs from "../components/AdminSystemLogs";
import type { Product } from "../types/product";

type Tab = "users" | "products" | "logs";

const emptyProduct: ProductCreate = {
  name: "",
  description: "",
  category: "keyboard",
  price_cents: 0,
  image_url: null,
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({ full_name: "", email: "", is_admin: false, balance: "0.00" });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductCreate>(emptyProduct);
  const [isNewProduct, setIsNewProduct] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([fetchAdminUsers(), fetchAdminProducts()]);
      setUsers(u);
      setProducts(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openUserEdit = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      is_admin: user.is_admin,
      balance: centsToDollars(user.balance_cents),
    });
    setMessage(null);
  };

  const saveUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateAdminUser(editingUser.id, {
        full_name: userForm.full_name,
        email: userForm.email,
        is_admin: userForm.is_admin,
        balance_cents: dollarsToCents(userForm.balance),
      });
      setMessage("User updated.");
      setEditingUser(null);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    }
  };

  const openProductEdit = (product: Product) => {
    setIsNewProduct(false);
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category as ProductCreate["category"],
      price_cents: product.price_cents,
      image_url: product.image_url,
    });
    setMessage(null);
  };

  const openProductCreate = () => {
    setIsNewProduct(true);
    setEditingProduct(null);
    setProductForm({ ...emptyProduct });
    setMessage(null);
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...productForm };
    try {
      if (isNewProduct) {
        await createAdminProduct(payload);
        setMessage("Product created.");
      } else if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        setMessage("Product updated.");
      }
      setEditingProduct(null);
      setIsNewProduct(false);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteAdminProduct(id);
      setMessage("Product deleted.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      tab === t ? "bg-grid-cyan/20 text-grid-cyan" : "text-grid-muted hover:text-white"
    }`;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white">Admin Panel</h1>
      <p className="mt-2 text-grid-muted">Manage users, balances, product catalog, and system event logs.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" className={tabClass("users")} onClick={() => setTab("users")}>
          Users
        </button>
        <button type="button" className={tabClass("products")} onClick={() => setTab("products")}>
          Products
        </button>
        <button type="button" className={tabClass("logs")} onClick={() => setTab("logs")}>
          System logs
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
      {loading && tab !== "logs" && <p className="mt-8 text-grid-muted">Loading…</p>}

      {tab === "logs" && <AdminSystemLogs />}

      {!loading && tab === "users" && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-grid-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-grid-border bg-grid-surface/80 text-grid-muted">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-grid-border/50 hover:bg-grid-surface/40">
                  <td className="px-4 py-3 text-white">{u.id}</td>
                  <td className="px-4 py-3 text-white">{u.full_name}</td>
                  <td className="px-4 py-3 text-grid-muted">{u.email}</td>
                  <td className="px-4 py-3 font-medium text-grid-cyan">{formatPrice(u.balance_cents)}</td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="rounded bg-grid-purple/30 px-2 py-0.5 text-xs text-grid-purple">Admin</span>
                    ) : (
                      <span className="text-grid-muted">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openUserEdit(u)}
                      className="text-grid-cyan hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "products" && (
        <>
          <AdminProductCsvImport onImported={load} />
          <button
            type="button"
            onClick={openProductCreate}
            className="mt-6 rounded-lg bg-gradient-to-r from-grid-cyan to-grid-purple px-4 py-2 text-sm font-semibold text-grid-dark"
          >
            + Add product
          </button>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-grid-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-grid-border bg-grid-surface/80 text-grid-muted">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-grid-border/50 hover:bg-grid-surface/40">
                    <td className="px-4 py-3 text-white">{p.id}</td>
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-grid-muted">{p.category}</td>
                    <td className="px-4 py-3">{formatPrice(p.price_cents)}</td>
                    <td className="px-4 py-3 space-x-3">
                      <button type="button" onClick={() => openProductEdit(p)} className="text-grid-cyan hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(p.id)} className="text-amber-400 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={saveUser}
            className="w-full max-w-md rounded-2xl border border-grid-border bg-grid-surface p-6"
          >
            <h2 className="font-display text-xl font-bold text-white">Edit user #{editingUser.id}</h2>
            <label className="mt-4 block text-sm text-grid-muted">
              Full name
              <input
                required
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Email
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Balance (CAD)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={userForm.balance}
                onChange={(e) => setUserForm({ ...userForm, balance: e.target.value })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={userForm.is_admin}
                onChange={(e) => setUserForm({ ...userForm, is_admin: e.target.checked })}
              />
              Administrator
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingUser(null)} className="text-grid-muted hover:text-white">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-grid-cyan px-4 py-2 font-semibold text-grid-dark">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {(editingProduct || isNewProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={saveProduct}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-grid-border bg-grid-surface p-6"
          >
            <h2 className="font-display text-xl font-bold text-white">
              {isNewProduct ? "New product" : `Edit product #${editingProduct!.id}`}
            </h2>
            <label className="mt-4 block text-sm text-grid-muted">
              Name
              <input
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Description
              <textarea
                required
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Category
              <select
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value as ProductCreate["category"] })
                }
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              >
                <option value="keyboard">Keyboard</option>
                <option value="mouse">Mouse</option>
                <option value="desk_mat">Desk mat</option>
              </select>
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Price (cents)
              <input
                required
                type="number"
                min="0"
                value={productForm.price_cents}
                onChange={(e) => setProductForm({ ...productForm, price_cents: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-grid-muted">
              Image URL (optional)
              <input
                value={productForm.image_url ?? ""}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value || null })}
                className="mt-1 w-full rounded-lg border border-grid-border bg-grid-dark px-3 py-2 text-white"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsNewProduct(false);
                }}
                className="text-grid-muted hover:text-white"
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-grid-cyan px-4 py-2 font-semibold text-grid-dark">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
