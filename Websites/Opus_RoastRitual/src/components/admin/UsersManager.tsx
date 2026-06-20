"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { formatCents } from "@/lib/format";
import type { Role } from "@/generated/prisma/enums";

type UserRow = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  role: Role;
  balanceCents: number;
};

type UserDetail = UserRow & {
  bio: string | null;
  balanceAdjustments: {
    id: string;
    adjustmentCents: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
    admin: { username: string };
  }[];
};

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    bio: "",
    role: "USER" as Role,
  });
  const [balanceForm, setBalanceForm] = useState({
    adjustmentDollars: "",
    reason: "",
  });

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`);
    const data = await res.json();
    if (!res.ok) return;
    setDetail(data.user);
    setForm({
      username: data.user.username,
      name: data.user.name ?? "",
      email: data.user.email ?? "",
      bio: data.user.bio ?? "",
      role: data.user.role,
    });
  }, []);

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, [loadUsers]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  async function saveUser() {
    if (!selectedId) return;
    setMessage(null);
    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Update failed" });
      return;
    }
    setMessage({ type: "success", text: "User updated" });
    await loadUsers();
    await loadDetail(selectedId);
  }

  async function adjustBalance() {
    if (!selectedId) return;
    setMessage(null);
    const dollars = parseFloat(balanceForm.adjustmentDollars);
    if (Number.isNaN(dollars) || dollars === 0) {
      setMessage({ type: "error", text: "Enter a non-zero dollar amount" });
      return;
    }
    const adjustmentCents = Math.round(dollars * 100);

    const res = await fetch(`/api/admin/users/${selectedId}/balance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adjustmentCents,
        reason: balanceForm.reason || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Adjustment failed" });
      return;
    }
    setMessage({ type: "success", text: "Balance updated" });
    setBalanceForm({ adjustmentDollars: "", reason: "" });
    await loadUsers();
    await loadDetail(selectedId);
  }

  async function deleteUser() {
    if (!selectedId) return;
    if (!window.confirm("Delete this user permanently?")) return;

    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Delete failed" });
      return;
    }
    setSelectedId(null);
    setMessage({ type: "success", text: "User deleted" });
    await loadUsers();
  }

  if (loading) {
    return <p className="text-sm text-espresso/60">Loading users…</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="font-medium text-espresso">All users ({users.length})</h2>
        <ul className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  selectedId === user.id
                    ? "border-espresso bg-espresso/5"
                    : "border-sage/25 bg-cream/50 hover:border-sage"
                }`}
              >
                <span className="font-medium">{user.username}</span>
                <span className="ml-2 text-xs text-espresso/50">{user.role}</span>
                <p className="mt-1 text-xs text-espresso/60">
                  Balance: {formatCents(user.balanceCents)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-sage/25 bg-cream/60 p-6">
        {!selectedId ? (
          <p className="text-sm text-espresso/60">
            Select a user to view and edit their record.
          </p>
        ) : (
          <div className="space-y-6">
            {message && (
              <Alert variant={message.type === "error" ? "error" : "success"}>
                {message.text}
              </Alert>
            )}

            {detail && (
              <p className="text-sm text-espresso/70">
                Current balance:{" "}
                <strong>{formatCents(detail.balanceCents)}</strong>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-role">Role</Label>
                <select
                  id="admin-role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as Role,
                    }))
                  }
                  className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-name">Display name</Label>
              <Input
                id="admin-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-bio">Bio</Label>
              <textarea
                id="admin-bio"
                rows={3}
                value={form.bio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm"
              />
            </div>

            <Button type="button" onClick={saveUser}>
              Save user
            </Button>

            <fieldset className="space-y-3 rounded-xl border border-sage/20 p-4">
              <legend className="px-1 text-sm font-medium">
                Adjust balance
              </legend>
              <p className="text-xs text-espresso/60">
                Use positive values to credit (e.g. 10.00) or negative to debit
                (e.g. -5.50).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="adjustment">Amount (USD)</Label>
                  <Input
                    id="adjustment"
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={balanceForm.adjustmentDollars}
                    onChange={(e) =>
                      setBalanceForm((f) => ({
                        ...f,
                        adjustmentDollars: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    value={balanceForm.reason}
                    onChange={(e) =>
                      setBalanceForm((f) => ({
                        ...f,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button type="button" variant="secondary" onClick={adjustBalance}>
                Apply adjustment
              </Button>
            </fieldset>

            {detail && detail.balanceAdjustments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Recent adjustments</h3>
                <ul className="mt-2 space-y-2 text-xs text-espresso/70">
                  {detail.balanceAdjustments.map((adj) => (
                    <li key={adj.id} className="rounded-lg bg-sage/10 px-3 py-2">
                      {formatCents(adj.adjustmentCents)} →{" "}
                      {formatCents(adj.balanceAfter)} by {adj.admin.username}
                      {adj.reason && ` — ${adj.reason}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              className="border-red-200 text-red-800 hover:bg-red-50"
              onClick={deleteUser}
            >
              Delete user
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
