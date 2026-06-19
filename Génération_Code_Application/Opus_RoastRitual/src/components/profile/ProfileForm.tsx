"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { Role } from "@/generated/prisma/enums";

export type ProfileUser = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  image: string | null;
  role: Role;
};

type ProfileFormProps = {
  user: ProfileUser;
  unauthorized?: boolean;
};

export function ProfileForm({ user, unauthorized }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    username: user.username,
    name: user.name ?? "",
    email: user.email ?? "",
    bio: user.bio ?? "",
    image: user.image ?? "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [previewImage, setPreviewImage] = useState(user.image);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body,
    });

    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Upload failed" });
      return;
    }

    setPreviewImage(data.image);
    setForm((prev) => ({ ...prev, image: data.image }));
    setMessage({ type: "success", text: "Profile picture updated" });
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error ?? "Update failed" });
      return;
    }

    setMessage({ type: "success", text: "Profile saved successfully" });
    setForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    }));
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete your account permanently? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch("/api/profile", { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Delete failed" });
      return;
    }

    await signOut({ callbackUrl: "/" });
  }

  const avatarSrc =
    previewImage ||
    `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(user.username)}`;

  return (
    <div className="space-y-8">
      {unauthorized && (
        <Alert variant="error">
          You do not have permission to access the admin area.
        </Alert>
      )}
      {message && (
        <Alert variant={message.type === "error" ? "error" : "success"}>
          {message.text}
        </Alert>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-sage/30 bg-linen">
          <Image
            src={avatarSrc}
            alt="Profile"
            fill
            className="object-cover"
            unoptimized={
              avatarSrc.startsWith("/uploads/") ||
              avatarSrc.startsWith("http")
            }
          />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm text-espresso/70">
            Role:{" "}
            <span className="font-medium text-espresso">
              {user.role === "ADMIN" ? "Administrator" : "Standard user"}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload image file"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="image">Profile picture URL</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={form.image}
            onChange={(e) => {
              updateField("image", e.target.value);
              if (e.target.value) setPreviewImage(e.target.value);
            }}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              maxLength={64}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={4}
            maxLength={500}
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm text-espresso placeholder:text-espresso/40 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
            placeholder="Tell us about your coffee or tea ritual…"
          />
        </div>

        <fieldset className="space-y-4 rounded-2xl border border-sage/20 p-6">
          <legend className="px-2 text-sm font-medium text-espresso">
            Change password (optional)
          </legend>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(e) => updateField("currentPassword", e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => updateField("newPassword", e.target.value)}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={form.confirmNewPassword}
                onChange={(e) =>
                  updateField("confirmNewPassword", e.target.value)
                }
                autoComplete="new-password"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>

      <div className="border-t border-sage/20 pt-8">
        <h2 className="font-display text-lg text-espresso">Danger zone</h2>
        <p className="mt-2 text-sm text-espresso/70">
          Permanently delete your account and all associated data.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4 border-red-200 text-red-800 hover:border-red-300 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
    </div>
  );
}
