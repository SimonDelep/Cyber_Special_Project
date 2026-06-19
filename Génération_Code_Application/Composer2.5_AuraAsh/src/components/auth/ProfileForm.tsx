"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { SafeUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/utils";

interface ProfileFormProps {
  user: SafeUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email ?? "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    bio: user.bio ?? "",
    profilePicture: user.profilePicture ?? "",
  });
  const [preview, setPreview] = useState(user.profilePicture ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "profilePicture") setPreview(value);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      const url = data.profilePicture as string;
      setPreview(url);
      setFormData((prev) => ({ ...prev, profilePicture: url }));
      setSuccess("Profile picture uploaded.");
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save profile");
        return;
      }

      setSuccess("Profile updated successfully.");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/profile", { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete account");
        setDeleting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-stone/15 bg-cream p-6">
        <h2 className="font-display text-xl text-charcoal">Profile Picture</h2>
        <p className="mt-1 text-sm text-stone">
          Upload an image file or paste an image URL.
        </p>

        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="size-24 overflow-hidden rounded-full border-2 border-stone/20 bg-warm-white">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Profile"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-2xl font-display text-stone">
                {formData.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <span
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-stone/30 px-5 py-2 text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {uploading ? "Uploading..." : "Upload Image"}
              </span>
            </label>
            <p className="text-xs text-stone">JPEG, PNG, WebP, or GIF — max 5 MB</p>
          </div>
        </div>

        <div className="mt-4">
          <Input
            name="profilePicture"
            label="Or paste an image URL"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={formData.profilePicture}
            onChange={(e) => updateField("profilePicture", e.target.value)}
          />
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-5">
        <h2 className="font-display text-xl text-charcoal">Account Details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            name="username"
            label="Username"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
            required
          />
          <Input
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
          <Input
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
          />
          <Input
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
          />
        </div>

        <Textarea
          name="bio"
          label="Bio"
          rows={4}
          placeholder="Tell us a little about yourself..."
          value={formData.bio}
          onChange={(e) => updateField("bio", e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-3 text-sm text-stone">
          <span className="rounded-full bg-charcoal/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-charcoal">
            {user.role}
          </span>
          <span>Balance: {formatPrice(user.balance)}</span>
          <span>Member since {formatDate(user.createdAt)}</span>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-display text-xl text-red-700">Danger Zone</h2>
        <p className="mt-1 text-sm text-stone">
          Permanently delete your account and all associated data.
        </p>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="danger"
            className="mt-4"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-red-700">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
