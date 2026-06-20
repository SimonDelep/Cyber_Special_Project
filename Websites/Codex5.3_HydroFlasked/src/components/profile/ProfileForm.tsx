"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { SafeUser } from "@/lib/auth/session";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { FormField } from "@/components/ui/FormField";
import { formatPrice } from "@/lib/format";
import { parseApiResponse } from "@/lib/parse-api-response";

type ProfileFormProps = {
  user: SafeUser;
};

export function ProfileForm({ user: initialUser }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState(initialUser);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.get("displayName") || null,
          email: form.get("email") || null,
          profileImageUrl: form.get("profileImageUrl") || null,
          currentPassword: form.get("currentPassword") || undefined,
          newPassword: form.get("newPassword") || undefined,
        }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Update failed");
        return;
      }

      setUser(data.user as SafeUser);
      setMessage("Profile updated successfully");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Upload failed");
        return;
      }

      setUser(data.user as SafeUser);
      setMessage("Profile picture updated");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setError("Enter your password to confirm deletion");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        setError((data.error as string) ?? "Could not delete account");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const displayLabel = user.displayName || user.username;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <UserAvatar src={user.profileImageUrl} alt={displayLabel} size={96} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-white">{displayLabel}</h2>
            <p className="text-sm text-slate-400">@{user.username}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-300">
                {user.role}
              </span>
              <span className="inline-block rounded-full bg-brand-500/20 px-3 py-0.5 text-xs font-medium text-brand-200">
                Balance: {formatPrice(user.balanceCents ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-300">Upload image file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              disabled={loading}
              className="mt-2 w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-400"
            />
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, or GIF — max 2 MB</p>
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg bg-brand-500/10 px-4 py-3 text-sm text-brand-200" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-8">
        <h3 className="text-lg font-semibold text-white">Edit profile</h3>
        <form onSubmit={handleProfileUpdate} className="mt-6 space-y-5">
          <FormField
            label="Display name"
            name="displayName"
            defaultValue={user.displayName ?? ""}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
          />
          <FormField
            label="Profile picture URL"
            name="profileImageUrl"
            defaultValue={user.profileImageUrl ?? ""}
            hint="Or upload a file above"
            placeholder="https://example.com/avatar.jpg"
          />
          <div className="border-t border-white/10 pt-6">
            <p className="mb-4 text-sm font-medium text-slate-300">Change password (optional)</p>
            <div className="space-y-5">
              <FormField
                label="Current password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
              />
              <FormField
                label="New password"
                name="newPassword"
                type="password"
                hint="Leave blank to keep current password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-red-950/20 p-8">
        <h3 className="text-lg font-semibold text-red-200">Danger zone</h3>
        <p className="mt-2 text-sm text-slate-400">
          Permanently delete your account and all sessions. This cannot be undone.
        </p>
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="mt-4 rounded-full border border-red-500/40 px-5 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Confirm with your password
              </span>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1.5 w-full max-w-sm rounded-lg border border-white/15 bg-slate-900/80 px-4 py-2.5 text-white focus:border-red-500 focus:outline-none"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                Confirm deletion
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setDeletePassword("");
                }}
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
