"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Role } from "@prisma/client";

export type ProfileData = {
  id: string;
  username: string;
  email: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePicture: string | null;
  createdAt: string;
};

type ProfileFormProps = {
  profile: ProfileData;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.profilePicture);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          bio: formData.get("bio"),
          profilePictureUrl: formData.get("profilePictureUrl"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }

      setAvatarUrl(data.profile.profilePicture);
      setSuccess("Profile updated successfully");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      setAvatarUrl(data.profilePicture);
      setSuccess("Profile picture uploaded");
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Deletion failed");
        setDeleting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-border/30">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
              {profile.username[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">@{profile.username}</span>
            {" · "}
            <span className="capitalize">{profile.role.toLowerCase()}</span>
          </p>
          <label className="inline-block cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-border/50">
            {uploading ? "Uploading…" : "Upload image file"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-muted">JPEG, PNG, WebP, or GIF — max 2 MB</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-5">
        <FormField
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={profile.email}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="First name"
            name="firstName"
            defaultValue={profile.firstName ?? ""}
            placeholder="Optional"
          />
          <FormField
            label="Last name"
            name="lastName"
            defaultValue={profile.lastName ?? ""}
            placeholder="Optional"
          />
        </div>
        <FormField
          label="Bio"
          name="bio"
          as="textarea"
          defaultValue={profile.bio ?? ""}
          placeholder="Tell us about yourself"
        />
        <FormField
          label="Profile picture URL"
          name="profilePictureUrl"
          type="url"
          defaultValue={profile.profilePicture ?? ""}
          placeholder="https://example.com/photo.jpg"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-accent px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="border-t border-border pt-8">
        <h3 className="text-lg font-semibold text-red-600">Danger zone</h3>
        <p className="mt-2 text-sm text-muted">
          Permanently delete your account and all associated data.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="rounded-full border border-red-300 px-6 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            {deleting ? "Deleting…" : "Delete account"}
          </button>
          <LogoutButton className="rounded-full border border-border px-6 py-2 text-sm font-medium transition-colors hover:bg-border/50" />
        </div>
      </div>
    </div>
  );
}
