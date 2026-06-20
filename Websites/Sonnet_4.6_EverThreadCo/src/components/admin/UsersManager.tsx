"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { centsToDollarsInput, dollarsToCents } from "@/lib/admin/utils";
import type { Role } from "@/generated/prisma/client";

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: Role;
  displayName: string | null;
  balanceCents: number;
  createdAt: string;
};

type UsersManagerProps = {
  users: AdminUserRow[];
};

export function UsersManager({ users: initialUsers }: UsersManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [balanceInput, setBalanceInput] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = users.find((u) => u.id === selectedId);

  async function loadUserDetails(id: string) {
    setSelectedId(id);
    setMessage(null);
    setError(null);
    setAdjustDelta("");

    const res = await fetch(`/api/admin/users/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load user");
      return;
    }

    setEmail(data.user.email);
    setDisplayName(data.user.displayName ?? "");
    setBio(data.user.bio ?? "");
    setRole(data.user.role);
    setBalanceInput(centsToDollarsInput(data.user.balanceCents));
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: displayName || null,
        bio: bio || null,
        role,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedId
          ? {
              ...u,
              email: data.user.email,
              displayName: data.user.displayName,
              role: data.user.role,
            }
          : u,
      ),
    );
    setMessage("User record updated");
    router.refresh();
  }

  async function setBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const cents = dollarsToCents(balanceInput);
    if (cents === null) {
      setError("Invalid balance amount");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "set", amountCents: cents }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Balance update failed");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedId
          ? { ...u, balanceCents: data.user.balanceCents }
          : u,
      ),
    );
    setMessage(`Balance set to ${formatPrice(data.user.balanceCents)}`);
    router.refresh();
  }

  async function adjustBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    const cents = dollarsToCents(adjustDelta);
    if (cents === null) {
      setError("Invalid adjustment amount");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "add", amountCents: cents }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Balance adjustment failed");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedId
          ? { ...u, balanceCents: data.user.balanceCents }
          : u,
      ),
    );
    setBalanceInput(centsToDollarsInput(data.user.balanceCents));
    setAdjustDelta("");
    setMessage(
      `Balance adjusted: ${formatPrice(data.previousBalanceCents)} → ${formatPrice(data.user.balanceCents)}`,
    );
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <h2 className="font-display text-2xl text-sand-900">Users</h2>
        <p className="mt-1 text-sm text-sand-600">
          {users.length} registered account{users.length !== 1 ? "s" : ""}
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-sand-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-sand-600">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`cursor-pointer border-t border-sand-100 ${
                    selectedId === user.id ? "bg-sage-50" : "hover:bg-cream-50"
                  }`}
                  onClick={() => void loadUserDetails(user.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-sand-900">@{user.username}</p>
                    <p className="text-xs text-sand-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sand-700">{user.role}</td>
                  <td className="px-4 py-3 text-sand-700">
                    {formatPrice(user.balanceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-3">
        {selected ? (
          <div className="space-y-6">
            <h3 className="font-display text-xl text-sand-900">
              Edit @{selected.username}
            </h3>

            {message ? (
              <p className="rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-800">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <form
              onSubmit={saveUser}
              className="space-y-4 rounded-xl border border-sand-200 bg-cream-50 p-6"
            >
              <h4 className="font-medium text-sand-900">Profile & role</h4>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="role" className="text-sm font-medium text-sand-800">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="rounded-xl border border-sand-300 bg-cream-50 px-4 py-2.5 text-sm"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <Button type="submit" disabled={loading}>
                Save user
              </Button>
            </form>

            <form
              onSubmit={setBalance}
              className="space-y-4 rounded-xl border border-sand-200 bg-cream-50 p-6"
            >
              <h4 className="font-medium text-sand-900">Set balance</h4>
              <p className="text-sm text-sand-600">
                Current: {formatPrice(selected.balanceCents)}
              </p>
              <Input
                label="New balance (CAD)"
                type="number"
                step="0.01"
                min="0"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={loading}>
                Set balance
              </Button>
            </form>

            <form
              onSubmit={adjustBalance}
              className="space-y-4 rounded-xl border border-sand-200 bg-cream-50 p-6"
            >
              <h4 className="font-medium text-sand-900">Adjust balance</h4>
              <p className="text-sm text-sand-600">
                Add or subtract (use negative values to deduct).
              </p>
              <Input
                label="Adjustment (CAD)"
                type="number"
                step="0.01"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="e.g. 25.00 or -10.00"
              />
              <Button type="submit" variant="secondary" disabled={loading}>
                Apply adjustment
              </Button>
            </form>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-sand-300 bg-cream-50 p-10 text-center text-sand-600">
            Select a user from the list to view and edit their record.
          </p>
        )}
      </div>
    </div>
  );
}
