import { useCallback, useEffect, useState } from "react";
import { api, formatMoney, PRODUCT_CATEGORIES } from "../api/client";
import Navbar from "../components/Navbar";

const TABS = [
  { id: "users", label: "Users" },
  { id: "products", label: "Products" },
  { id: "logs", label: "System Logs" },
];

const emptyProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "hot_sauce",
  price: "",
  image_url: "",
};

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-6xl w-full px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-stone-900">Admin Panel</h1>
        <p className="mt-2 text-stone-600">
          Manage users, balances, product catalog, and monitor system events.
        </p>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3">{message}</p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
        )}

        <div className="mt-8 flex gap-2 border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setMessage("");
                setError("");
              }}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "users" && (
            <UsersSection
              onMessage={setMessage}
              onError={setError}
              clearAlerts={() => {
                setMessage("");
                setError("");
              }}
            />
          )}
          {tab === "products" && (
            <ProductsSection
              onMessage={setMessage}
              onError={setError}
              clearAlerts={() => {
                setMessage("");
                setError("");
              }}
            />
          )}
          {tab === "logs" && <LogsSection onError={setError} />}
        </div>
      </main>
    </div>
  );
}

function UsersSection({ onMessage, onError, clearAlerts }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
    balance: "",
  });
  const [adjustment, setAdjustment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    api
      .listUsers()
      .then(setUsers)
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [onError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const selectUser = (u) => {
    clearAlerts();
    setSelected(u);
    setForm({
      email: u.email,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      role: u.role,
      balance: String(u.balance),
    });
    setAdjustment("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    clearAlerts();
    try {
      const updated = await api.updateUser(selected.id, {
        email: form.email,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        role: form.role,
        balance: parseFloat(form.balance),
      });
      onMessage(`Updated user ${updated.username}`);
      setSelected(updated);
      loadUsers();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!selected || adjustment === "") return;
    setSaving(true);
    clearAlerts();
    try {
      const updated = await api.adjustBalance(selected.id, parseFloat(adjustment));
      onMessage(
        `Balance adjusted for ${updated.username}: now ${formatMoney(updated.balance)}`,
      );
      setForm((f) => ({ ...f, balance: String(updated.balance) }));
      setSelected(updated);
      setAdjustment("");
      loadUsers();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-stone-500">Loading users…</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className={`border-t border-stone-100 cursor-pointer hover:bg-brand-50/50 ${
                    selected?.id === u.id ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.username}</span>
                    <span className="block text-xs text-stone-500">{u.email}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(u.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {selected ? (
          <>
            <h2 className="text-lg font-semibold text-stone-900">
              Edit user: {selected.username}
            </h2>
            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <Field label="Email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} type="email" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
                <Field label="Last name" value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Field
                label="Balance (set absolute)"
                value={form.balance}
                onChange={(v) => setForm((f) => ({ ...f, balance: v }))}
                type="number"
                step="0.01"
                min="0"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                Save user
              </button>
            </form>

            <form onSubmit={handleAdjust} className="mt-8 pt-6 border-t border-stone-100 space-y-3">
              <h3 className="text-sm font-semibold text-stone-800">Adjust balance</h3>
              <p className="text-xs text-stone-500">
                Add or subtract funds (e.g. 25.00 or -10.50).
              </p>
              <Field
                label="Adjustment amount"
                value={adjustment}
                onChange={setAdjustment}
                type="number"
                step="0.01"
              />
              <button
                type="submit"
                disabled={saving || adjustment === ""}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-60"
              >
                Apply adjustment
              </button>
            </form>
          </>
        ) : (
          <p className="text-stone-500">Select a user from the list to edit.</p>
        )}
      </div>
    </div>
  );
}

function ProductsSection({ onMessage, onError, clearAlerts }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProductForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    api
      .listProducts()
      .then(setProducts)
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [onError]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setForm(emptyProductForm);
    setEditingId(null);
  };

  const startEdit = (p) => {
    clearAlerts();
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      category: p.category,
      price: String(p.price),
      image_url: p.image_url || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    clearAlerts();
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price),
      image_url: form.image_url || null,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();

    try {
      if (editingId) {
        const updated = await api.updateProduct(editingId, payload);
        onMessage(`Updated product “${updated.name}”`);
      } else {
        const created = await api.createProduct(payload);
        onMessage(`Created product “${created.name}”`);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Delete “${p.name}”?`)) return;
    clearAlerts();
    try {
      await api.deleteProduct(p.id);
      onMessage(`Deleted product “${p.name}”`);
      if (editingId === p.id) resetForm();
      loadProducts();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleDownloadSample = async () => {
    clearAlerts();
    try {
      await api.downloadProductsImportSample();
    } catch (err) {
      onError(err.message);
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      onError("Choose a CSV file to upload");
      return;
    }
    setImporting(true);
    clearAlerts();
    setImportResult(null);
    try {
      const result = await api.importProductsCsv(csvFile);
      setImportResult(result);
      if (result.created > 0) {
        onMessage(`Imported ${result.created} product${result.created === 1 ? "" : "s"} from CSV`);
        loadProducts();
      } else if (result.failed > 0) {
        onError("No products were imported. Fix the errors below and try again.");
      }
      setCsvFile(null);
      e.target.reset();
    } catch (err) {
      onError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Bulk import (CSV)</h2>
        <p className="mt-2 text-sm text-stone-600">
          Upload a CSV to create many products at once. Required columns:{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">name</code>,{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">category</code>,{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">price</code>. Optional:{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">description</code>,{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">slug</code>,{" "}
          <code className="text-xs bg-stone-100 px-1 rounded">image_url</code>. Categories:{" "}
          <span className="font-mono text-xs">hot_sauce</span>,{" "}
          <span className="font-mono text-xs">truffle_oil</span>,{" "}
          <span className="font-mono text-xs">spice_blend</span>.
        </p>
        <p className="mt-1 text-sm text-stone-500">
          A sample file is in <span className="font-mono text-xs">samples/products_import_sample.csv</span>{" "}
          in the project, or download it below.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Download sample CSV
          </button>
        </div>
        <form onSubmit={handleCsvImport} className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">CSV file</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(ev) => setCsvFile(ev.target.files?.[0] || null)}
              className="mt-1 block text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          <button
            type="submit"
            disabled={importing || !csvFile}
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {importing ? "Importing…" : "Upload & import"}
          </button>
        </form>
        {importResult && importResult.errors?.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900">
              {importResult.failed} row{importResult.failed === 1 ? "" : "s"} failed
              {importResult.created > 0 ? ` (${importResult.created} imported successfully)` : ""}
            </p>
            <ul className="mt-2 list-disc pl-5 text-amber-800 space-y-1">
              {importResult.errors.map((err) => (
                <li key={`${err.row}-${err.error}`}>
                  Row {err.row}: {err.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-stone-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-stone-500">No products yet. Create one on the right.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-xs text-stone-500 capitalize">
                      {p.category.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatMoney(p.price)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="text-red-600 font-semibold hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {editingId ? "Edit product" : "New product"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                clearAlerts();
              }}
              className="text-sm text-stone-500 hover:text-stone-800"
            >
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
          <Field
            label="Slug (optional)"
            value={form.slug}
            onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
            hint="Auto-generated from name if empty"
          />
          <div>
            <label className="block text-sm font-medium text-stone-700">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </div>
          <Field
            label="Price (CAD)"
            value={form.price}
            onChange={(v) => setForm((f) => ({ ...f, price: v }))}
            type="number"
            step="0.01"
            min="0.01"
            required
          />
          <Field
            label="Image URL (optional)"
            value={form.image_url}
            onChange={(v) => setForm((f) => ({ ...f, image_url: v }))}
            type="url"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update product" : "Create product"}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
}

function LogsSection({ onError }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    event_type: "",
    status: "",
    username: "",
  });

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = { limit: 100 };
    if (filters.event_type) params.event_type = filters.event_type;
    if (filters.status) params.status = filters.status;
    if (filters.username.trim()) params.username = filters.username.trim();
    api
      .getEventLogs(params)
      .then(setLogs)
      .catch((e) => onError(e.message))
      .finally(() => setLoading(false));
  }, [filters, onError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const eventTypes = [
    { value: "login_success", label: "Login success" },
    { value: "login_failure", label: "Login failure" },
    { value: "logout", label: "Logout" },
    { value: "register", label: "Register" },
    { value: "profile_update", label: "Profile update" },
    { value: "profile_delete", label: "Profile delete" },
    { value: "avatar_update", label: "Avatar update" },
    { value: "checkout_success", label: "Checkout success" },
    { value: "checkout_failure", label: "Checkout failure" },
    { value: "admin_user_update", label: "Admin user update" },
    { value: "admin_balance_adjust", label: "Admin balance adjust" },
    { value: "admin_product_import", label: "Admin product import" },
  ];

  return (
    <div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm mb-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-stone-600">Event type</label>
            <select
              value={filters.event_type}
              onChange={(e) => setFilters((f) => ({ ...f, event_type: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              {eventTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Username</label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))}
              placeholder="Filter by user"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={loadLogs}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading logs…</p>
      ) : logs.length === 0 ? (
        <p className="text-stone-500">No events recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-stone-100 text-stone-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-stone-100 align-top">
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium">
                      {log.event_type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{log.username || "—"}</td>
                  <td className="px-4 py-3 text-stone-500">{log.ip_address || "—"}</td>
                  <td className="px-4 py-3">
                    <p>{log.message}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="mt-1 text-xs text-stone-500 bg-stone-50 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, hint, step, min }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 outline-none"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
