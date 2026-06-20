"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
  type ActionState,
} from "@/app/profile/actions";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { UserAvatar } from "@/components/profile/UserAvatar";
import type { Role } from "@prisma/client";

type ProfileUser = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  profileImageUrl: string | null;
  role: Role;
  createdAt: string;
};

const initialState: ActionState = {};

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-sage-200/80 bg-cream-50 p-6 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-sage-900">{title}</h2>
      <p className="mt-1 text-sm text-sage-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ProfileForms({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(user.profileImageUrl);

  const displayName = user.name ?? user.username;

  async function handleAvatarUpload(file: File) {
    setAvatarError(null);
    setAvatarLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { profileImageUrl?: string; error?: string };
    setAvatarLoading(false);

    if (!response.ok) {
      setAvatarError(data.error ?? "Upload failed.");
      return;
    }

    const newUrl = data.profileImageUrl ?? null;
    setPreviewUrl(newUrl);
    await updateSession({ user: { image: newUrl ?? undefined } });
    router.refresh();
  }

  useEffect(() => {
    if (profileState.success && profileState.user) {
      setPreviewUrl(profileState.user.image);
      void updateSession({
        user: {
          name: profileState.user.name,
          image: profileState.user.image ?? undefined,
        },
      });
      router.refresh();
    }
  }, [profileState, updateSession, router]);

  return (
    <div className="space-y-8">
      <ProfileSection title="Your profile" description="Account overview and profile picture.">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <UserAvatar name={displayName} imageUrl={previewUrl} />
          <div className="space-y-2 text-sm text-sage-700">
            <p>
              <span className="font-medium text-sage-900">Username:</span> @{user.username}
            </p>
            <p>
              <span className="font-medium text-sage-900">Role:</span>{" "}
              {user.role === "ADMIN" ? "Administrator" : "Standard user"}
            </p>
            <p>
              <span className="font-medium text-sage-900">Member since:</span>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-sage-200/60 pt-6">
          <p className="text-sm font-medium text-sage-800">Profile picture</p>
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleAvatarUpload(file);
              }}
            />
            <button
              type="button"
              disabled={avatarLoading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-sage-300 px-4 py-2 text-sm font-medium text-sage-800 hover:bg-sage-50 disabled:opacity-60"
            >
              {avatarLoading ? "Uploading…" : "Upload image file"}
            </button>
          </div>
          {avatarError && <FormMessage type="error" message={avatarError} />}
          <p className="text-xs text-sage-500">JPEG, PNG, WebP, or GIF — max 2 MB.</p>
        </div>
      </ProfileSection>

      <ProfileSection
        title="Edit profile"
        description="Update your display name, email, or set a picture from a URL."
      >
        <form action={profileAction} className="space-y-4">
          {profileState.error && <FormMessage type="error" message={profileState.error} />}
          {profileState.success && (
            <FormMessage type="success" message="Profile updated successfully." />
          )}
          <FormField label="Display name" name="name" defaultValue={user.name ?? ""} />
          <FormField
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
          />
          <FormField
            label="Profile picture URL"
            name="profileImageUrl"
            type="url"
            placeholder="https://example.com/photo.jpg"
            defaultValue={previewUrl?.startsWith("http") ? previewUrl : ""}
            hint="Or upload a file above. URL and upload can be used together — saving this form sets the URL."
          />
          <button
            type="submit"
            disabled={profilePending}
            className="rounded-full bg-sage-700 px-6 py-2.5 text-sm font-medium text-cream-50 hover:bg-sage-900 disabled:opacity-60"
          >
            {profilePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </ProfileSection>

      <ProfileSection title="Change password" description="Update your sign-in password.">
        <form action={passwordAction} className="space-y-4">
          {passwordState.error && <FormMessage type="error" message={passwordState.error} />}
          {passwordState.success && (
            <FormMessage type="success" message="Password updated successfully." />
          )}
          <FormField
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <FormField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <FormField
            label="Confirm new password"
            name="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-full border border-sage-300 px-6 py-2.5 text-sm font-medium text-sage-800 hover:bg-sage-50 disabled:opacity-60"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </ProfileSection>

      <ProfileSection
        title="Delete account"
        description="Permanently remove your account and profile data. This cannot be undone."
      >
        <form action={deleteAction} className="space-y-4">
          {deleteState.error && <FormMessage type="error" message={deleteState.error} />}
          <FormField
            label="Confirm with your password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button
            type="submit"
            disabled={deletePending}
            className="rounded-full border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {deletePending ? "Deleting…" : "Delete my account"}
          </button>
        </form>
      </ProfileSection>
    </div>
  );
}
