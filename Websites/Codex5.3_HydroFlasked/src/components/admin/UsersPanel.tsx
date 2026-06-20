"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/admin/serializers";
import { formatPrice, centsToDollarInput, dollarInputToCents } from "@/lib/format";
import { parseApiResponse } from "@/lib/parse-api-response";
import { UserAvatar } from "@/components/auth/UserAvatar";

type UsersPanelProps = {
  initialUsers: AdminUser[];
  currentAdminId: string;
};

export function UsersPanel({ initialUsers, currentAdminId }: UsersPanelProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const editingUser = users.find((u) => u.id === editingId);

  async function refreshUsers() {
    const res = await fetch("/api/admin/users");
    const data = await parseApiResponse(res);
    if (res.ok && Array.isArray(data.users)) {
      setUsers(data.users as AdminUser[]);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const form = new FormData(e.currentTarget);
      const balanceInput = form.get("balanceDollars") as string;
      const balanceCents = dollarInputToCents(balanceInput);

      if (balanceCents === null) {
        setError("Invalid balance amount");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: (form.get("displayName") as string) || null,
          email: (form.get("email") as string) || null,
          role: form.get("role"),
          profileImageUrl: (form.get("profileImageUrl") as string) || null,
          balanceCents,
        }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError((data.error as string) ?? "Update failed");
        return;
      }

      if (!data.user) {
        setError("Server returned an invalid response");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? (data.user as AdminUser) : u)),
      );
      setMessage("User updated successfully");
      setEditingId(null);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function adjustBalance(userId: string, adjustmentCents: number) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustmentCents }),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError((data.error as string) ?? "Balance adjustment failed");
        return;
      }

      const updated = data.user as AdminUser;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setMessage(
        `Balance adjusted by ${adjustmentCents >= 0 ? "+" : ""}${formatPrice(adjustmentCents)}`,
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId: string, username: string) {
    if (!confirm(`Delete user @${username}? This cannot be undone.`)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await parseApiResponse(res);
      if (!res.ok) {
        setError((data.error as string) ?? "Delete failed");
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setEditingId(null);
      setMessage("User deleted");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-lg bg-brand-500/10 px-4 py-2 text-sm text-brand-200">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="bg-slate-950/40 hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={user.profileImageUrl}
                      alt={user.displayName || user.username}
                      size={36}
                    />
                    <div>
                      <p className="font-medium text-white">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN"
                        ? "bg-brand-500/20 text-brand-300"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  {formatPrice(user.balanceCents)}
                </td>
                <td className="px-4 py-3 text-slate-400">{user.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => adjustBalance(user.id, 1000)}
                      disabled={loading}
                      className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-300 hover:border-brand-500/50"
                      title="Add $10.00"
                    >
                      +$10
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBalance(user.id, -1000)}
                      disabled={loading}
                      className="rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-300 hover:border-brand-500/50"
                      title="Subtract $10.00"
                    >
                      −$10
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                    >
                      {editingId === user.id ? "Close" : "Edit"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={refreshUsers}
        disabled={loading}
        className="text-sm text-brand-400 hover:text-brand-300"
      >
        Refresh list
      </button>

      {editingUser ? (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-brand-500/30 bg-slate-900/60 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">
            Edit @{editingUser.username}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-300">Display name</span>
              <input
                name="displayName"
                defaultValue={editingUser.displayName ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                defaultValue={editingUser.email ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Role</span>
              <select
                name="role"
                defaultValue={editingUser.role}
                disabled={editingUser.id === currentAdminId}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Balance (CAD)</span>
              <input
                name="balanceDollars"
                type="number"
                step="0.01"
                min="0"
                defaultValue={centsToDollarInput(editingUser.balanceCents)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm text-slate-300">Profile image URL</span>
              <input
                name="profileImageUrl"
                defaultValue={editingUser.profileImageUrl ?? ""}
                className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              Save user
            </button>
            {editingUser.id !== currentAdminId ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDelete(editingUser.id, editingUser.username)}
                className="rounded-full border border-red-500/40 px-5 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Delete user
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
