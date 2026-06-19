import { useEffect, useState } from "react";
import { adminApi, avatarSrc, formatMoney } from "../../api/client";

const emptyUserForm = {
  username: "",
  email: "",
  full_name: "",
  role: "user",
  profile_picture_url: "",
};

export default function AdminUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyUserForm);
  const [balanceMode, setBalanceMode] = useState("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    adminApi
      .listUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username,
      email: user.email || "",
      full_name: user.full_name || "",
      role: user.role,
      profile_picture_url: user.profile_picture_url || "",
    });
    setBalanceAmount("");
    setBalanceMode("add");
    setMessage("");
    setError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyUserForm);
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updateUser(editing.id, {
        username: form.username,
        email: form.email || null,
        full_name: form.full_name || null,
        role: form.role,
        profile_picture_url: form.profile_picture_url || null,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(updated);
      setMessage("User updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    const amount = parseFloat(balanceAmount);
    if (Number.isNaN(amount)) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.adjustBalance(editing.id, {
        amount,
        mode: balanceMode,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(updated);
      setBalanceAmount("");
      setMessage(
        balanceMode === "set"
          ? `Balance set to ${formatMoney(updated.balance)}.`
          : `Balance adjusted to ${formatMoney(updated.balance)}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="py-12 text-center text-soil-500">Loading users…</p>
    );
  }

  return (
    <div>
      {error && !editing && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-soil-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-soil-50 text-soil-600">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soil-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-soil-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {avatarSrc(u.profile_picture_url) ? (
                      <img
                        src={avatarSrc(u.profile_picture_url)}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sprout-500 text-xs font-bold text-white">
                        {u.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-soil-900">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-soil-600">{u.email || "—"}</td>
                <td className="px-4 py-3 font-medium text-soil-900">
                  {formatMoney(u.balance ?? 0)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      u.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-soil-100 text-soil-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    className="text-sm font-medium text-sprout-600 hover:text-sprout-700"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-soil-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-soil-900">
                Edit user — {editing.username}
              </h3>
              <button
                type="button"
                onClick={closeEdit}
                className="text-soil-400 hover:text-soil-600"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm text-soil-500">
              Current balance: {formatMoney(editing.balance ?? 0)}
            </p>

            {message && (
              <p className="mt-4 rounded-lg bg-sprout-500/10 px-4 py-2 text-sm text-sprout-700">
                {message}
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSaveUser} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-soil-700">Username</label>
                <input
                  name="username"
                  required
                  value={form.username}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">Full name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-soil-700">
                  Profile picture URL
                </label>
                <input
                  name="profile_picture_url"
                  value={form.profile_picture_url}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-soil-800 py-2.5 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
              >
                Save user
              </button>
            </form>

            <form onSubmit={handleAdjustBalance} className="mt-8 border-t border-soil-100 pt-6 space-y-4">
              <h4 className="font-medium text-soil-900">Adjust balance</h4>
              <div className="flex gap-2">
                <select
                  value={balanceMode}
                  onChange={(e) => setBalanceMode(e.target.value)}
                  className="rounded-lg border border-soil-200 px-3 py-2 text-sm"
                >
                  <option value="add">Add / subtract</option>
                  <option value="set">Set to amount</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder={balanceMode === "set" ? "New balance" : "Amount (+/-)"}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="flex-1 rounded-lg border border-soil-200 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-full bg-sprout-500 py-2.5 text-sm font-medium text-white hover:bg-sprout-600 disabled:opacity-60"
              >
                Apply balance change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
