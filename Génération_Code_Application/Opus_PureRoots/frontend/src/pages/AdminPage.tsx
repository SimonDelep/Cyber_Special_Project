import { ChangeEvent, FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import SystemLogsTab from "../components/admin/SystemLogsTab";
import * as adminApi from "../api/admin";
import type { Product } from "../types/product";
import type { User, UserRole } from "../types/user";

type Tab = "users" | "products" | "logs";

const CATEGORIES = [
  { value: "oral-care", label: "Oral care" },
  { value: "personal-care", label: "Personal care" },
  { value: "household", label: "Household" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-forest-200 px-3 py-2 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const flash = useCallback((msg: string | null, err: string | null = null) => {
    setMessage(msg);
    setError(err);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-800">Admin panel</h1>
      <p className="mt-2 text-stone-600">
        Manage users, balances, products, and system event logs.
      </p>

      {message && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-2 border-b border-forest-200">
        {(["users", "products", "logs"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              flash(null, null);
            }}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-forest-600 text-forest-700"
                : "border-transparent text-stone-500 hover:text-forest-600"
            }`}
          >
            {t === "logs" ? "System logs" : t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "users" && <UsersTab flash={flash} />}
        {tab === "products" && <ProductsTab flash={flash} />}
        {tab === "logs" && <SystemLogsTab />}
      </div>
    </div>
  );
}

function UsersTab({ flash }: { flash: (msg: string | null, err?: string | null) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [balanceUser, setBalanceUser] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await adminApi.listUsers());
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {loading ? (
        <p className="text-stone-600">Loading users…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-forest-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest-200 bg-forest-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-forest-700">User</th>
                <th className="px-4 py-3 font-medium text-forest-700">Email</th>
                <th className="px-4 py-3 font-medium text-forest-700">Role</th>
                <th className="px-4 py-3 font-medium text-forest-700">Balance</th>
                <th className="px-4 py-3 font-medium text-forest-700">Status</th>
                <th className="px-4 py-3 font-medium text-forest-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-forest-100 last:border-0">
                  <td className="px-4 py-3 font-medium">@{u.username}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-forest-600 text-white"
                          : "bg-forest-100 text-forest-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-forest-700">
                    {adminApi.formatMoney(u.balance)}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="text-green-700">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(u)}
                        className="text-forest-600 hover:text-forest-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceUser(u)}
                        className="text-forest-600 hover:text-forest-800"
                      >
                        Balance
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UserEditModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            flash("User updated.");
          }}
          onError={(e) => flash(null, e)}
        />
      )}

      {balanceUser && (
        <BalanceModal
          user={balanceUser}
          onClose={() => setBalanceUser(null)}
          onSaved={async () => {
            setBalanceUser(null);
            await load();
            flash("Balance updated.");
          }}
          onError={(e) => flash(null, e)}
        />
      )}
    </>
  );
}

function UserEditModal({
  user,
  onClose,
  onSaved,
  onError,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [email, setEmail] = useState(user.email);
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, {
        email,
        full_name: fullName,
        phone,
        role,
        is_active: isActive,
      });
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit @${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-forest-700">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Full name
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Phone
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-forest-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Account active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-forest-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BalanceModal({
  user,
  onClose,
  onSaved,
  onError,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"adjust" | "set">("adjust");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function applyBalance() {
    setLocalError(null);
    const trimmed = amount.trim();
    if (trimmed === "") {
      setLocalError("Please enter an amount.");
      return;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      setLocalError("Enter a valid number.");
      return;
    }
    if (mode === "set" && value < 0) {
      setLocalError("Balance cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "set") {
        await adminApi.adjustBalance(user.id, { balance: value });
      } else {
        await adminApi.adjustBalance(user.id, { adjustment: value });
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Balance update failed";
      setLocalError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void applyBalance();
  }

  return (
    <Modal title={`Balance — @${user.username}`} onClose={onClose}>
      <p className="text-sm text-stone-600">
        Current balance: <strong>{adminApi.formatMoney(user.balance)}</strong>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("adjust");
            setLocalError(null);
          }}
          className={`rounded-full px-3 py-1 text-sm ${mode === "adjust" ? "bg-forest-600 text-white" : "bg-forest-100"}`}
        >
          Add / subtract
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("set");
            setLocalError(null);
          }}
          className={`rounded-full px-3 py-1 text-sm ${mode === "set" ? "bg-forest-600 text-white" : "bg-forest-100"}`}
        >
          Set exact amount
        </button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        {localError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {localError}
          </p>
        )}
        <label className="block text-sm font-medium text-forest-700">
          {mode === "adjust" ? "Adjustment (use negative to subtract)" : "New balance (CAD)"}
          <input
            type="text"
            inputMode="decimal"
            placeholder={mode === "adjust" ? "e.g. 10 or -5" : "e.g. 50.00"}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-forest-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void applyBalance()}
            disabled={saving}
            className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
          >
            {saving ? "Applying…" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProductsTab({ flash }: { flash: (msg: string | null, err?: string | null) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await adminApi.listProducts());
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCsvImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportErrors([]);
    try {
      const result = await adminApi.importProductsFromCsv(file);
      await load();
      setImportErrors(result.errors);
      if (result.created > 0 && result.failed === 0) {
        flash(`Imported ${result.created} product${result.created === 1 ? "" : "s"} from CSV.`);
      } else if (result.created > 0) {
        flash(
          `Imported ${result.created} product${result.created === 1 ? "" : "s"}; ${result.failed} row${result.failed === 1 ? "" : "s"} failed.`
        );
      } else {
        flash(null, "No products were imported. Check the errors below.");
      }
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "CSV import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await adminApi.deleteProduct(p.id);
      await load();
      flash("Product deleted.");
    } catch (err) {
      flash(null, err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <>
      <div className="mb-6 rounded-2xl border border-forest-200/80 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-forest-800">Import products from CSV</h3>
        <p className="mt-1 text-sm text-stone-600">
          Required columns: <span className="font-mono text-xs">name</span>,{" "}
          <span className="font-mono text-xs">category</span>,{" "}
          <span className="font-mono text-xs">price</span>. Optional:{" "}
          <span className="font-mono text-xs">description</span>,{" "}
          <span className="font-mono text-xs">slug</span>,{" "}
          <span className="font-mono text-xs">image_url</span>.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            {importing ? "Importing…" : "Upload CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={importing}
              onChange={handleCsvImport}
            />
          </label>
          <a
            href="/products_import_sample.csv"
            download="products_import_sample.csv"
            className="rounded-full border border-forest-300 px-5 py-2 text-sm font-medium text-forest-700 hover:bg-forest-50"
          >
            Download sample CSV
          </a>
        </div>
        {importErrors.length > 0 && (
          <ul className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {importErrors.map((err) => (
              <li key={`${err.row}-${err.message}`}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Add product
        </button>
      </div>

      {loading ? (
        <p className="text-stone-600">Loading products…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-forest-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-forest-200 bg-forest-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-forest-700">Name</th>
                <th className="px-4 py-3 font-medium text-forest-700">Category</th>
                <th className="px-4 py-3 font-medium text-forest-700">Price</th>
                <th className="px-4 py-3 font-medium text-forest-700">Slug</th>
                <th className="px-4 py-3 font-medium text-forest-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-forest-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-stone-600">{p.category}</td>
                  <td className="px-4 py-3">{adminApi.formatMoney(p.price)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{p.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="text-forest-600 hover:text-forest-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <ProductFormModal
          title="New product"
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            setShowCreate(false);
            await load();
            flash("Product created.");
          }}
          onError={(e) => flash(null, e)}
        />
      )}

      {editing && (
        <ProductFormModal
          title="Edit product"
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            flash("Product updated.");
          }}
          onError={(e) => flash(null, e)}
        />
      )}
    </>
  );
}

function ProductFormModal({
  title,
  product,
  onClose,
  onSaved,
  onError,
}: {
  title: string;
  product?: Product;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [category, setCategory] = useState(product?.category ?? "oral-care");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || undefined,
        category,
        description,
        price,
        image_url: imageUrl || undefined,
      };
      if (product) {
        await adminApi.updateProduct(product.id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <label className="block text-sm font-medium text-forest-700">
          Name *
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Slug (auto-generated if empty)
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="bamboo-brush-soft" />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Category *
          <select required value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Price (CAD) *
          <input type="number" step="0.01" min="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Description
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-forest-700">
          Image URL
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-forest-200 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-forest-600 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forest-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
