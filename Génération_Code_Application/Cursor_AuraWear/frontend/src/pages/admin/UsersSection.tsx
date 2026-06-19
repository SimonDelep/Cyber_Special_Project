import { FormEvent, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import { ApiError } from "../../api/client";
import FormField from "../../components/FormField";
import type { AdminUserUpdatePayload, BalanceUpdatePayload, User, UserRole } from "../../types/user";
import { formatCurrency } from "../../utils/format";

export default function UsersSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [adjustment, setAdjustment] = useState("");
  const [setBalance, setSetBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch {
      setError("Could not load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selected) {
      setEmail(selected.email);
      setRole(selected.role);
      setFirstName(selected.first_name ?? "");
      setLastName(selected.last_name ?? "");
      setPhone(selected.phone ?? "");
      setAdjustment("");
      setSetBalance("");
      setMessage("");
    }
  }, [selected]);

  function selectUser(user: User) {
    setSelectedId(user.id === selectedId ? null : user.id);
  }

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage("");
    setError("");
    const payload: AdminUserUpdatePayload = {
      email,
      role,
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
    };
    try {
      const updated = await adminApi.updateUser(selected.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setMessage("User updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleBalanceSave(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (!adjustment && !setBalance) {
      setError("Enter an adjustment or a new balance");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    const payload: BalanceUpdatePayload = {};
    if (adjustment) payload.adjustment = adjustment;
    if (setBalance) payload.set_balance = setBalance;
    try {
      const updated = await adminApi.adjustUserBalance(selected.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setAdjustment("");
      setSetBalance("");
      setMessage("Balance updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Balance update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        {loading && <p className="text-sm text-aura-600">Loading users…</p>}
        {error && !selected && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {!loading && (
          <div className="overflow-hidden rounded-2xl border border-aura-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-aura-200 bg-aura-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-aura-800">User</th>
                  <th className="px-4 py-3 font-semibold text-aura-800">Role</th>
                  <th className="px-4 py-3 font-semibold text-aura-800">Balance</th>
                  <th className="px-4 py-3 font-semibold text-aura-800" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-aura-100 last:border-0 ${
                      selectedId === u.id ? "bg-aura-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-aura-950">@{u.username}</p>
                      <p className="text-xs text-aura-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-aura-700">{u.role}</td>
                    <td className="px-4 py-3 font-medium text-aura-950">
                      {formatCurrency(u.balance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => selectUser(u)}
                        className="text-sm font-semibold text-aura-800 hover:text-aura-950"
                      >
                        {selectedId === u.id ? "Close" : "Edit"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {selected ? (
          <div className="space-y-6">
            {message && (
              <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
            )}
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <form
              onSubmit={handleProfileSave}
              className="rounded-2xl border border-aura-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-aura-950">Edit @{selected.username}</h3>
              <div className="mt-4 space-y-4">
                <FormField id="admin-email" label="Email" type="email" value={email} onChange={setEmail} required />
                <div>
                  <label htmlFor="admin-role" className="mb-1.5 block text-sm font-medium text-aura-800">
                    Role
                  </label>
                  <select
                    id="admin-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-aura-300 px-4 py-2.5 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <FormField id="admin-first" label="First name" value={firstName} onChange={setFirstName} />
                <FormField id="admin-last" label="Last name" value={lastName} onChange={setLastName} />
                <FormField id="admin-phone" label="Phone" value={phone} onChange={setPhone} />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-full bg-aura-950 px-5 py-2.5 text-sm font-semibold text-aura-50 hover:bg-aura-800 disabled:opacity-60"
              >
                Save user
              </button>
            </form>

            <form
              onSubmit={handleBalanceSave}
              className="rounded-2xl border border-aura-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-semibold text-aura-950">Wallet balance</h3>
              <p className="mt-1 text-sm text-aura-600">
                Current: <strong>{formatCurrency(selected.balance)}</strong>
              </p>
              <div className="mt-4 space-y-4">
                <FormField
                  id="adjustment"
                  label="Adjustment (+ / −)"
                  value={adjustment}
                  onChange={setAdjustment}
                  hint="e.g. 25.00 or -10.50"
                />
                <FormField
                  id="set-balance"
                  label="Or set exact balance"
                  value={setBalance}
                  onChange={setSetBalance}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-full border border-aura-300 px-5 py-2.5 text-sm font-semibold text-aura-800 hover:border-aura-400 disabled:opacity-60"
              >
                Update balance
              </button>
            </form>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-aura-300 bg-aura-50/50 p-6 text-sm text-aura-600">
            Select a user to edit their profile or adjust their balance.
          </p>
        )}
      </div>
    </div>
  );
}
