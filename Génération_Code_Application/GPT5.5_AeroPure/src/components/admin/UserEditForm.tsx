"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import type { AdminUser } from "@/types/admin";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type UserEditFormProps = {
  user: AdminUser;
  onUpdated: (user: AdminUser) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
};

export function UserEditForm({
  user,
  onUpdated,
  onDeleted,
  onError,
}: UserEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustment, setAdjustment] = useState("");

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          role: formData.get("role"),
          balance: formData.get("balance"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }

      onUpdated({
        ...user,
        ...data.user,
        balance: data.user.balance,
        createdAt: user.createdAt,
      });
    } catch {
      setError("Something went wrong");
      onError("Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustBalance() {
    const value = parseFloat(adjustment);
    if (isNaN(value) || value === 0) {
      setError("Enter a non-zero adjustment amount");
      return;
    }

    setError(null);
    setAdjusting(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/balance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Adjustment failed");
        return;
      }

      setAdjustment("");
      onUpdated({
        ...user,
        balance: data.user.balance,
      });
    } catch {
      setError("Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        setLoading(false);
        return;
      }
      onDeleted(user.id);
    } catch {
      setError("Delete failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={user.email}
        />
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user.role}
            className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value={Role.USER}>USER</option>
            <option value={Role.ADMIN}>ADMIN</option>
          </select>
        </div>
        <FormField
          label="First name"
          name="firstName"
          defaultValue={user.firstName ?? ""}
        />
        <FormField
          label="Last name"
          name="lastName"
          defaultValue={user.lastName ?? ""}
        />
        <FormField
          label="Balance (CAD)"
          name="balance"
          type="number"
          required
          defaultValue={String(user.balance)}
        />
        <p className="text-xs text-muted sm:col-span-2">
          Set an absolute balance above, or use a quick adjustment below (e.g.{" "}
          <code className="rounded bg-border/50 px-1">50</code> to add $50,{" "}
          <code className="rounded bg-border/50 px-1">-10</code> to subtract).
        </p>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save user"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-full border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800"
          >
            Delete user
          </button>
        </div>
      </form>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-semibold">Quick balance adjustment</h4>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="adjustment" className="block text-sm font-medium">
              Amount (+/-)
            </label>
            <input
              id="adjustment"
              type="number"
              step="0.01"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              placeholder="e.g. 25 or -10"
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={handleAdjustBalance}
            disabled={adjusting}
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-border/50 disabled:opacity-50"
          >
            {adjusting ? "Applying…" : "Apply adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
