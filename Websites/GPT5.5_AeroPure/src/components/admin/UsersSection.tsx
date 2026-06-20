"use client";

import { useState } from "react";
import type { AdminUser } from "@/types/admin";
import { UserEditForm } from "@/components/admin/UserEditForm";
import { formatBalance } from "@/lib/utils";

type UsersSectionProps = {
  initialUsers: AdminUser[];
  onNotify: (msg: string | null) => void;
};

export function UsersSection({ initialUsers, onNotify }: UsersSectionProps) {
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleUpdated(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingId(null);
    onNotify("User updated successfully");
  }

  function handleDeleted(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setEditingId(null);
    onNotify("User deleted");
  }

  const editingUser = users.find((u) => u.id === editingId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        View and edit user records, set balances, or apply adjustments.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                        : "text-muted"
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatBalance(u.balance)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(editingId === u.id ? null : u.id)
                    }
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {editingId === u.id ? "Close" : "Edit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-lg font-semibold">
            Edit user: {editingUser.username}
          </h3>
          <div className="mt-6">
            <UserEditForm
              user={editingUser}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onError={(msg) => alert(msg)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
