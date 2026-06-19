"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { roleLabel } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

export type ProfileUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

type ProfileFormProps = {
  user: ProfileUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(user.email);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewAvatar = avatarUrl.trim() || user.avatarUrl;

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }

    setAvatarUrl(data.avatarUrl);
    await update({
      user: { image: data.avatarUrl },
    });
    setMessage("Profile picture uploaded");
    router.refresh();
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: displayName || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        confirmNewPassword: confirmNewPassword || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }

    await update({
      user: {
        name: data.user.displayName ?? data.user.username,
        email: data.user.email,
        image: data.user.avatarUrl,
        displayName: data.user.displayName,
        bio: data.user.bio,
      },
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setMessage("Profile saved successfully");
    router.refresh();
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (
      !confirm(
        "This permanently deletes your account and cannot be undone. Continue?",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete account");
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl text-sand-900">Your profile</h1>
        <p className="mt-2 text-sm text-sand-600">
          @{user.username} · {roleLabel(user.role)}
        </p>
      </div>

      {message ? (
        <p className="mb-6 rounded-lg bg-sage-50 px-4 py-3 text-sm text-sage-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="mb-10 rounded-2xl border border-sand-200 bg-cream-50 p-6">
        <h2 className="font-display text-xl text-sand-900">Profile picture</h2>
        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-sand-200 ring-2 ring-sand-300">
            {previewAvatar ? (
              <Image
                src={previewAvatar}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized={previewAvatar.startsWith("/uploads/")}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-medium text-sand-500">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <Input
              label="Image URL"
              name="avatarUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-sand-800">
                Or upload a file (max 2 MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="text-sm text-sand-700 file:mr-4 file:rounded-full file:border-0 file:bg-sand-200 file:px-4 file:py-2 file:text-sm file:font-medium"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarUpload(file);
                }}
              />
              {uploading ? (
                <p className="mt-2 text-xs text-sand-500">Uploading…</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleProfileSave}
        className="space-y-10 rounded-2xl border border-sand-200 bg-cream-50 p-6"
      >
        <div>
          <h2 className="font-display text-xl text-sand-900">Account details</h2>
          <div className="mt-6 flex flex-col gap-5">
            <Input
              label="Username"
              name="username"
              value={user.username}
              disabled
              className="opacity-70"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Display name"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Textarea
              label="Bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself…"
            />
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-sand-900">Change password</h2>
          <p className="mt-1 text-sm text-sand-600">
            Leave blank to keep your current password.
          </p>
          <div className="mt-6 flex flex-col gap-5">
            <Input
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm new password"
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <form
        onSubmit={handleDeleteAccount}
        className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-6"
      >
        <h2 className="font-display text-xl text-red-900">Delete account</h2>
        <p className="mt-2 text-sm text-red-800/90">
          Permanently remove your account and all profile data. This action
          cannot be undone.
        </p>
        <div className="mt-6 max-w-md">
          <Input
            label="Confirm with your password"
            name="deletePassword"
            type="password"
            required
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={loading}
          className="mt-6 border-red-300 text-red-900 hover:bg-red-100"
        >
          Delete my account
        </Button>
      </form>
    </div>
  );
}
