import { createSignal, For, Show } from "solid-js";
import type { AdminUserView } from "@/lib/auth/types";
import { formatPrice } from "@/lib/format";

function centsFromDollars(value: string): number | null {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export default function AdminUsersPanel() {
  const [users, setUsers] = createSignal<AdminUserView[]>([]);
  const [selectedId, setSelectedId] = createSignal<number | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [error, setError] = createSignal("");

  const [displayName, setDisplayName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [role, setRole] = createSignal<"user" | "admin">("user");
  const [bio, setBio] = createSignal("");
  const [balanceDollars, setBalanceDollars] = createSignal("");
  const [adjustDollars, setAdjustDollars] = createSignal("");

  const selected = () => users().find((u) => u.id === selectedId()) ?? null;

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load users.");
        return;
      }
      setUsers(json.users ?? []);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function selectUser(u: AdminUserView) {
    setSelectedId(u.id);
    setDisplayName(u.displayName);
    setEmail(u.email);
    setRole(u.role);
    setBio(u.bio);
    setBalanceDollars((u.balanceCents / 100).toFixed(2));
    setAdjustDollars("");
    setMessage("");
    setError("");
  }

  async function saveUser() {
    const id = selectedId();
    if (!id) return;

    setSaving(true);
    setMessage("");
    setError("");

    const balanceCents = centsFromDollars(balanceDollars());
    if (balanceCents === null) {
      setError("Balance must be a valid non-negative amount.");
      setSaving(false);
      return;
    }

    const payload: Record<string, unknown> = {
      displayName: displayName(),
      email: email(),
      role: role(),
      bio: bio(),
      balanceCents,
    };

    const adj = adjustDollars().trim();
    if (adj !== "") {
      const adjCents = centsFromDollars(adj);
      if (adjCents === null) {
        setError("Adjustment must be a valid amount (use negative to subtract).");
        setSaving(false);
        return;
      }
      payload.balanceAdjustmentCents = adjCents;
      delete payload.balanceCents;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Update failed.");
        return;
      }
      setUsers((list) => list.map((u) => (u.id === id ? json.user : u)));
      selectUser(json.user);
      setMessage("User updated.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    const id = selectedId();
    const u = selected();
    if (!id || !u) return;
    if (!confirm(`Delete user @${u.username}? This cannot be undone.`)) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Delete failed.");
        return;
      }
      setUsers((list) => list.filter((x) => x.id !== id));
      setSelectedId(null);
      setMessage("User deleted.");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  loadUsers();

  return (
    <div class="grid gap-8 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <Show when={loading()}>
          <p class="text-muted">Loading users…</p>
        </Show>
        <Show when={!loading()}>
          <div class="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
            <ul class="max-h-[32rem] divide-y divide-brand-50 overflow-y-auto">
              <For each={users()}>
                {(u) => (
                  <li>
                    <button
                      type="button"
                      class={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-brand-50 ${
                        selectedId() === u.id ? "bg-brand-50" : ""
                      }`}
                      onClick={() => selectUser(u)}
                    >
                      <span>
                        <span class="font-medium text-ink">{u.displayName}</span>
                        <span class="block text-xs text-muted">@{u.username}</span>
                      </span>
                      <span class="text-right text-xs">
                        <span class="block font-medium text-brand-800">
                          {formatPrice(u.balanceCents)}
                        </span>
                        <span class="capitalize text-muted">{u.role}</span>
                      </span>
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>

      <div class="lg:col-span-3">
        <Show
          when={selected()}
          fallback={
            <p class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center text-muted">
              Select a user to view and edit their record.
            </p>
          }
        >
          {(u) => (
            <form
              class="space-y-4 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                saveUser();
              }}
            >
              <h2 class="text-lg font-semibold text-ink">
                Edit user — @{u().username}
              </h2>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-ink">Display name</label>
                  <input
                    type="text"
                    value={displayName()}
                    onInput={(e) => setDisplayName(e.currentTarget.value)}
                    class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-ink">Email</label>
                  <input
                    type="email"
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-ink">Role</label>
                  <select
                    value={role()}
                    onChange={(e) =>
                      setRole(e.currentTarget.value as "user" | "admin")
                    }
                    class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-ink">
                    Balance (CAD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={balanceDollars()}
                    onInput={(e) => setBalanceDollars(e.currentTarget.value)}
                    class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                  />
                  <p class="mt-1 text-xs text-muted">
                    Current: {formatPrice(u().balanceCents)}
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-ink">
                  Adjust balance (CAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.00 or -5.00"
                  value={adjustDollars()}
                  onInput={(e) => setAdjustDollars(e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
                <p class="mt-1 text-xs text-muted">
                  If set, adds to current balance instead of replacing it.
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-ink">Bio</label>
                <textarea
                  rows={3}
                  maxlength={500}
                  value={bio()}
                  onInput={(e) => setBio(e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 text-sm"
                />
              </div>

              <Show when={message()}>
                <p class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  {message()}
                </p>
              </Show>
              <Show when={error()}>
                <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error()}
                </p>
              </Show>

              <div class="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving()}
                  class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving() ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  disabled={saving()}
                  onClick={deleteUser}
                  class="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete user
                </button>
              </div>
            </form>
          )}
        </Show>
      </div>
    </div>
  );
}
