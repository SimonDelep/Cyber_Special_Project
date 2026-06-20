import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import AdminRoute from "../components/AdminRoute";
import Navbar from "../components/Navbar";
import type { Product, ProductInput } from "../types/product";
import type { EventStatus, EventType, SystemEvent } from "../types/systemEvent";
import type { User, UserRole } from "../types/user";

type Tab = "users" | "products" | "logs";

const EVENT_TYPES: EventType[] = [
  "login_attempt",
  "logout",
  "register",
  "profile_update",
  "profile_avatar",
  "account_delete",
  "checkout_request",
  "admin_user_update",
  "admin_balance_adjust",
];

const EVENT_STATUSES: EventStatus[] = ["success", "failure", "info"];

function formatEventType(type: string) {
  return type.replace(/_/g, " ");
}

function statusClass(status: EventStatus) {
  if (status === "success") return "text-fog";
  if (status === "failure") return "text-red-300";
  return "text-mist/60";
}

const emptyProduct: ProductInput = {
  slug: "",
  name: "",
  description: "",
  category: "canvas-prints",
  price: 0,
  image_url: "",
};

function AdminContent() {
  const [tab, setTab] = useState<Tab>("users");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userBio, setUserBio] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [userActive, setUserActive] = useState(true);
  const [userBalance, setUserBalance] = useState("");
  const [balanceAdjust, setBalanceAdjust] = useState("");
  const [setBalanceAbsolute, setSetBalanceAbsolute] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct);
  const [showProductForm, setShowProductForm] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [logEventType, setLogEventType] = useState<EventType | "">("");
  const [logStatus, setLogStatus] = useState<EventStatus | "">("");
  const [logUserId, setLogUserId] = useState("");

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const loadUsers = useCallback(async () => {
    setUsers(await api.listUsers());
  }, []);

  const loadProducts = useCallback(async () => {
    setProducts(await api.listProducts());
  }, []);

  const loadEvents = useCallback(async () => {
    setEvents(
      await api.listSystemEvents({
        limit: 200,
        event_type: logEventType || undefined,
        status: logStatus || undefined,
        user_id: logUserId ? Number(logUserId) : undefined,
      }),
    );
  }, [logEventType, logStatus, logUserId]);

  useEffect(() => {
    setError("");
    if (tab === "users") loadUsers().catch((e) => setError(String(e)));
    else if (tab === "products") loadProducts().catch((e) => setError(String(e)));
    else loadEvents().catch((e) => setError(String(e)));
  }, [tab, loadUsers, loadProducts, loadEvents]);

  useEffect(() => {
    if (!selectedUser) return;
    setUserEmail(selectedUser.email);
    setUserFullName(selectedUser.full_name ?? "");
    setUserBio(selectedUser.bio ?? "");
    setUserRole(selectedUser.role);
    setUserActive(selectedUser.is_active);
    setUserBalance(String(Number(selectedUser.balance)));
    setBalanceAdjust("");
    setSetBalanceAbsolute("");
  }, [selectedUser]);

  function flash(msg: string, isError = false) {
    if (isError) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
  }

  async function handleUserSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const balance = parseFloat(userBalance);
      if (Number.isNaN(balance) || balance < 0) {
        flash("Enter a valid balance (0 or greater).", true);
        return;
      }
      const updated = await api.updateUser(selectedUserId, {
        email: userEmail.trim(),
        full_name: userFullName || null,
        bio: userBio || null,
        role: userRole,
        is_active: userActive,
        balance,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
      flash("User updated.");
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Update failed", true);
    }
  }

  async function handleBalanceAdjust(e: FormEvent) {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      if (setBalanceAbsolute.trim()) {
        await api.adjustBalance(selectedUserId, {
          balance: parseFloat(setBalanceAbsolute),
        });
      } else if (balanceAdjust.trim()) {
        await api.adjustBalance(selectedUserId, {
          adjustment: parseFloat(balanceAdjust),
        });
      } else return;
      await loadUsers();
      flash("Balance updated.");
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Balance update failed", true);
    }
  }

  function startNewProduct() {
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setShowProductForm(true);
  }

  function startEditProduct(p: Product) {
    setEditingProductId(p.id);
    setProductForm({
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category,
      price: Number(p.price),
      image_url: p.image_url ?? "",
    });
    setShowProductForm(true);
  }

  async function handleProductSave(e: FormEvent) {
    e.preventDefault();
    const payload: ProductInput = {
      ...productForm,
      price: Number(productForm.price),
      image_url: productForm.image_url || null,
    };
    try {
      if (editingProductId) {
        await api.updateProduct(editingProductId, payload);
        flash("Product updated.");
      } else {
        await api.createProduct(payload);
        flash("Product created.");
      }
      setShowProductForm(false);
      await loadProducts();
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Product save failed", true);
    }
  }

  async function handleProductDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      if (editingProductId === id) setShowProductForm(false);
      await loadProducts();
      flash("Product deleted.");
    } catch (err) {
      flash(err instanceof ApiError ? err.message : "Delete failed", true);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-16 pt-28">
        <h1 className="font-display text-4xl text-mist">Admin panel</h1>
        <p className="mt-2 text-sm text-mist/60">
          Manage users, balances, product catalog, and system event log.
        </p>

        {(message || error) && (
          <div
            className={`mt-6 rounded-sm px-4 py-3 text-sm ${
              error ? "bg-red-950/50 text-red-200" : "bg-fog/20"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="mt-8 flex gap-2 border-b border-white/10">
          {(["users", "products", "logs"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition ${
                tab === t
                  ? "border-b-2 border-gold text-gold"
                  : "text-mist/60 hover:text-mist"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <section className="overflow-hidden rounded-sm border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-deep/80 text-xs uppercase tracking-wider text-mist/50">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`cursor-pointer border-t border-white/5 transition hover:bg-deep/40 ${
                        selectedUserId === u.id ? "bg-deep/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{u.username}</span>
                        <span className="block text-xs text-mist/50">{u.email}</span>
                      </td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3 text-gold">
                        ${Number(u.balance).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="text-fog">Active</span>
                        ) : (
                          <span className="text-red-300">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-sm border border-white/5 bg-deep/50 p-6">
              {selectedUser ? (
                <>
                  <h2 className="font-display text-xl text-gold">
                    Edit {selectedUser.username}
                  </h2>
                  <form onSubmit={handleUserSave} className="mt-4 space-y-3">
                    <label className="block text-sm">
                      <span className="text-mist/70">Email</span>
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-mist/70">Full name</span>
                      <input
                        type="text"
                        value={userFullName}
                        onChange={(e) => setUserFullName(e.target.value)}
                        className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-mist/70">Bio</span>
                      <textarea
                        rows={2}
                        value={userBio}
                        onChange={(e) => setUserBio(e.target.value)}
                        className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm">
                        <span className="text-mist/70">Role</span>
                        <select
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value as UserRole)}
                          className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-sm">
                        <input
                          type="checkbox"
                          checked={userActive}
                          onChange={(e) => setUserActive(e.target.checked)}
                        />
                        Active account
                      </label>
                    </div>
                    <label className="block text-sm">
                      <span className="text-mist/70">Balance ($)</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={userBalance}
                        onChange={(e) => setUserBalance(e.target.value)}
                        className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold/90"
                    >
                      Save user
                    </button>
                  </form>

                  <form
                    onSubmit={handleBalanceAdjust}
                    className="mt-6 border-t border-white/10 pt-6"
                  >
                    <h3 className="text-sm font-medium text-gold">
                      Quick balance adjustment
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="text-mist/70">Add/subtract ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 25 or -10"
                          value={balanceAdjust}
                          onChange={(e) => setBalanceAdjust(e.target.value)}
                          className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="text-mist/70">Or set exact ($)</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 100.00"
                          value={setBalanceAbsolute}
                          onChange={(e) => setSetBalanceAbsolute(e.target.value)}
                          className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="mt-3 rounded-sm border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10"
                    >
                      Apply balance change
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-mist/50">
                  Select a user from the table to edit.
                </p>
              )}
            </section>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-8">
            <section className="rounded-sm border border-white/5 bg-deep/50 p-6">
              <h2 className="font-display text-xl text-gold">Import products from CSV</h2>
              <p className="mt-2 text-sm text-mist/60">
                Upload a UTF-8 CSV with columns:{" "}
                <code className="text-fog">slug, name, description, category, price, image_url</code>
                . Slug must be unique (lowercase, numbers, hyphens).{" "}
                <code className="text-fog">image_url</code> is optional.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    api
                      .downloadProductImportSample()
                      .catch((e) => flash(String(e), true))
                  }
                  className="rounded-sm border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10"
                >
                  Download sample CSV
                </button>
                <label className="cursor-pointer rounded-sm border border-white/10 px-4 py-2 text-sm hover:border-mist/40">
                  {csvFile ? csvFile.name : "Choose CSV file"}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  disabled={!csvFile || csvImporting}
                  onClick={async () => {
                    if (!csvFile) return;
                    setCsvImporting(true);
                    try {
                      const result = await api.importProductsCsv(csvFile);
                      await loadProducts();
                      setCsvFile(null);
                      const errNote =
                        result.error_count > 0
                          ? ` ${result.error_count} row(s) skipped.`
                          : "";
                      flash(`Imported ${result.created_count} product(s).${errNote}`);
                      if (result.errors.length > 0) {
                        setError(result.errors.join("\n"));
                      }
                    } catch (err) {
                      flash(
                        err instanceof ApiError ? err.message : "Import failed",
                        true,
                      );
                    } finally {
                      setCsvImporting(false);
                    }
                  }}
                  className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
                >
                  {csvImporting ? "Importing…" : "Upload & import"}
                </button>
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={startNewProduct}
                className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold/90"
              >
                New product
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-sm border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-deep/80 text-xs uppercase tracking-wider text-mist/50">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-mist/60">{p.slug}</td>
                      <td className="px-4 py-3">{p.category}</td>
                      <td className="px-4 py-3 text-gold">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="mr-3 text-gold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProductDelete(p.id)}
                          className="text-red-300 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showProductForm && (
              <form
                onSubmit={handleProductSave}
                className="mt-8 rounded-sm border border-gold/20 bg-deep/50 p-6"
              >
                <h2 className="font-display text-xl text-gold">
                  {editingProductId ? "Edit product" : "New product"}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm sm:col-span-1">
                    <span className="text-mist/70">Slug</span>
                    <input
                      required
                      pattern="[a-z0-9-]+"
                      value={productForm.slug}
                      onChange={(e) =>
                        setProductForm({ ...productForm, slug: e.target.value })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-mist/70">Category</span>
                    <select
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({ ...productForm, category: e.target.value })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    >
                      <option value="canvas-prints">canvas-prints</option>
                      <option value="vintage-prints">vintage-prints</option>
                      <option value="gallery-sets">gallery-sets</option>
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-mist/70">Name</span>
                    <input
                      required
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-mist/70">Description</span>
                    <textarea
                      required
                      rows={3}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-mist/70">Price ($)</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0.01"
                      value={productForm.price || ""}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-mist/70">Image URL</span>
                    <input
                      type="url"
                      value={productForm.image_url ?? ""}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          image_url: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none"
                    />
                  </label>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink"
                  >
                    {editingProductId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="rounded-sm border border-mist/30 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "logs" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-end gap-4 rounded-sm border border-white/5 bg-deep/50 p-4">
              <label className="text-sm">
                <span className="text-mist/70">Event type</span>
                <select
                  value={logEventType}
                  onChange={(e) => setLogEventType(e.target.value as EventType | "")}
                  className="mt-1 block rounded-sm border border-white/10 bg-ink px-3 py-2"
                >
                  <option value="">All types</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {formatEventType(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-mist/70">Status</span>
                <select
                  value={logStatus}
                  onChange={(e) => setLogStatus(e.target.value as EventStatus | "")}
                  className="mt-1 block rounded-sm border border-white/10 bg-ink px-3 py-2"
                >
                  <option value="">All statuses</option>
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-mist/70">User ID</span>
                <input
                  type="number"
                  min={1}
                  value={logUserId}
                  onChange={(e) => setLogUserId(e.target.value)}
                  placeholder="Any"
                  className="mt-1 block w-28 rounded-sm border border-white/10 bg-ink px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={() => loadEvents().catch((e) => flash(String(e), true))}
                className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 overflow-x-auto rounded-sm border border-white/5">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-deep/80 text-xs uppercase tracking-wider text-mist/50">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-mist/50">
                        No events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} className="border-t border-white/5 align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-mist/50">
                          {new Date(ev.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 capitalize text-mist/80">
                          {formatEventType(ev.event_type)}
                        </td>
                        <td className={`px-4 py-3 capitalize ${statusClass(ev.status)}`}>
                          {ev.status}
                        </td>
                        <td className="px-4 py-3">
                          {ev.username ?? "—"}
                          {ev.user_id != null && (
                            <span className="block text-xs text-mist/40">
                              id {ev.user_id}
                            </span>
                          )}
                        </td>
                        <td className="max-w-md px-4 py-3 text-mist/70">
                          {ev.message}
                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                            <pre className="mt-1 overflow-x-auto rounded bg-ink/80 p-2 text-xs text-mist/40">
                              {JSON.stringify(ev.metadata, null, 2)}
                            </pre>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-mist/40">
                          {ev.ip_address ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
