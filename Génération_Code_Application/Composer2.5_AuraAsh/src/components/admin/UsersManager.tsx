"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatPrice } from "@/lib/utils";
import type { AdminUser } from "@/types/admin";

export function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "USER" as "USER" | "ADMIN",
  });
  const [adjustment, setAdjustment] = useState("");
  const [setBalance, setSetBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({
      username: user.username,
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: user.role,
    });
    setAdjustment("");
    setSetBalance(user.balance.toFixed(2));
    setMessage("");
    setError("");
  }

  function closeEdit() {
    setEditing(null);
    setMessage("");
    setError("");
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update user");

      setMessage("User updated successfully.");
      setEditing(data.user);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjustBalance() {
    if (!editing) return;
    const value = parseFloat(adjustment);
    if (isNaN(value) || value === 0) {
      setError("Enter a non-zero adjustment amount (e.g. 10 or -5)");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/users/${editing.id}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to adjust balance");

      setMessage(
        `Balance adjusted by ${value >= 0 ? "+" : ""}${formatPrice(value)}. New balance: ${formatPrice(data.user.balance)}.`,
      );
      setEditing({ ...editing, balance: data.user.balance });
      setAdjustment("");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetBalance() {
    if (!editing) return;
    const value = parseFloat(setBalance);
    if (isNaN(value) || value < 0) {
      setError("Enter a valid balance (0 or greater)");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/users/${editing.id}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to set balance");

      setMessage(`Balance set to ${formatPrice(data.user.balance)}.`);
      setEditing({ ...editing, balance: data.user.balance });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set balance");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user");

      if (editing?.id === user.id) closeEdit();
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  if (loading) {
    return <p className="text-sm text-stone">Loading users...</p>;
  }

  return (
    <div className="space-y-6">
      {error && !editing && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-stone/15">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone/15 bg-cream">
            <tr>
              <th className="px-4 py-3 font-medium text-charcoal">Username</th>
              <th className="px-4 py-3 font-medium text-charcoal">Email</th>
              <th className="px-4 py-3 font-medium text-charcoal">Role</th>
              <th className="px-4 py-3 font-medium text-charcoal">Balance</th>
              <th className="px-4 py-3 font-medium text-charcoal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-stone/10 last:border-0">
                <td className="px-4 py-3 font-medium">{user.username}</td>
                <td className="px-4 py-3 text-stone">{user.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-charcoal/10 px-2 py-0.5 text-xs font-medium uppercase">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{formatPrice(user.balance)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(user)}
                      className="text-ember hover:text-ember-dark"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-700"
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

      {editing && (
        <div className="rounded-2xl border border-stone/15 bg-warm-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-charcoal">
              Edit User: {editing.username}
            </h3>
            <button
              type="button"
              onClick={closeEdit}
              className="text-sm text-stone hover:text-charcoal"
            >
              Close
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <Select
              label="Role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "USER" | "ADMIN" })
              }
              options={[
                { value: "USER", label: "User" },
                { value: "ADMIN", label: "Admin" },
              ]}
            />
          </div>

          <Button className="mt-4" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save User"}
          </Button>

          <div className="mt-8 rounded-xl border border-stone/15 bg-cream p-5">
            <h4 className="font-medium text-charcoal">
              Balance: {formatPrice(editing.balance)}
            </h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  label="Adjust balance (+/-)"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25.00 or -10.00"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={handleAdjustBalance}
                  disabled={saving}
                >
                  Apply Adjustment
                </Button>
              </div>
              <div>
                <Input
                  label="Set exact balance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={setBalance}
                  onChange={(e) => setSetBalance(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={handleSetBalance}
                  disabled={saving}
                >
                  Set Balance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
