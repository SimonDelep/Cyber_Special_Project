import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as usersApi from "../api/users";
import { ApiError } from "../api/client";
import FormField from "../components/FormField";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/format";

type AvatarMode = "url" | "upload";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarMode, setAvatarMode] = useState<AvatarMode>("url");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setPhone(user.phone ?? "");
      setAvatarUrl(user.avatar_url ?? "");
    }
  }, [user]);

  if (!user) return null;

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setSavingProfile(true);
    try {
      await usersApi.updateProfile({
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
      });
      await refreshUser();
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarUrlSave(event: FormEvent) {
    event.preventDefault();
    setAvatarMessage("");
    setAvatarError("");
    setSavingAvatar(true);
    try {
      await usersApi.updateProfile({ avatar_url: avatarUrl.trim() || null });
      await refreshUser();
      setAvatarMessage("Profile picture updated.");
      setAvatarFile(null);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Could not update picture");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleAvatarUpload() {
    if (!avatarFile) {
      setAvatarError("Choose an image file first.");
      return;
    }
    setAvatarMessage("");
    setAvatarError("");
    setSavingAvatar(true);
    try {
      const result = await usersApi.uploadAvatar(avatarFile);
      setAvatarUrl(result.avatar_url);
      await refreshUser();
      setAvatarMessage("Profile picture uploaded.");
      setAvatarFile(null);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarMessage("");
    setAvatarError("");
    setSavingAvatar(true);
    try {
      await usersApi.updateProfile({ avatar_url: null });
      setAvatarUrl("");
      setAvatarFile(null);
      await refreshUser();
      setAvatarMessage("Profile picture removed.");
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : "Could not remove picture");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password changed. Please sign in again.");
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleting(true);
    try {
      await usersApi.deleteAccount(deletePassword);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center gap-5">
        <UserAvatar user={user} size="lg" />
        <div>
          <h1 className="font-display text-3xl font-semibold text-aura-950">My profile</h1>
          <p className="mt-2 text-aura-600">
            Signed in as <span className="font-medium text-aura-800">@{user.username}</span>
            {user.role === "admin" && (
              <span className="ml-2 rounded-full bg-aura-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-aura-800">
                Admin
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-aura-600">
            Wallet balance:{" "}
            <span className="font-semibold text-aura-950">
              {formatCurrency(user.balance ?? "0")}
            </span>
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-aura-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-aura-950">Profile picture</h2>
        <p className="mt-1 text-sm text-aura-600">
          Use an image link or upload a file from your device (JPEG, PNG, WebP, GIF — max 5 MB).
        </p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          {(["url", "upload"] as AvatarMode[]).map((mode) => (
            <label key={mode} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="avatarMode"
                checked={avatarMode === mode}
                onChange={() => {
                  setAvatarMode(mode);
                  setAvatarError("");
                }}
              />
              {mode === "url" ? "Image link" : "Upload file"}
            </label>
          ))}
        </div>

        {avatarMode === "url" ? (
          <form onSubmit={handleAvatarUrlSave} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-aura-800">Image URL</span>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-lg border border-aura-200 px-4 py-2.5 text-sm outline-none ring-aura-400 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={savingAvatar}
              className="rounded-full bg-aura-950 px-6 py-2.5 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
            >
              {savingAvatar ? "Saving…" : "Save picture"}
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-aura-700 file:mr-4 file:rounded-full file:border-0 file:bg-aura-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-aura-50"
            />
            <button
              type="button"
              disabled={savingAvatar || !avatarFile}
              onClick={handleAvatarUpload}
              className="rounded-full bg-aura-950 px-6 py-2.5 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
            >
              {savingAvatar ? "Uploading…" : "Upload picture"}
            </button>
          </div>
        )}

        {user.avatar_url && (
          <button
            type="button"
            disabled={savingAvatar}
            onClick={handleRemoveAvatar}
            className="mt-4 text-sm font-medium text-aura-600 hover:text-red-700 disabled:opacity-60"
          >
            Remove picture
          </button>
        )}

        {avatarMessage && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{avatarMessage}</p>
        )}
        {avatarError && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {avatarError}
          </p>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-aura-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-aura-950">Personal information</h2>
        <p className="mt-1 text-sm text-aura-600">Update your contact details.</p>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          {profileMessage && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{profileMessage}</p>
          )}
          {profileError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {profileError}
            </p>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-aura-800">Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-aura-200 bg-aura-50 px-4 py-2.5 text-sm text-aura-500"
            />
          </div>
          <FormField id="email" label="Email" type="email" value={email} onChange={setEmail} required />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="firstName" label="First name" value={firstName} onChange={setFirstName} />
            <FormField id="lastName" label="Last name" value={lastName} onChange={setLastName} />
          </div>
          <FormField id="phone" label="Phone" type="tel" value={phone} onChange={setPhone} />
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-full bg-aura-950 px-6 py-2.5 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-aura-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-aura-950">Change password</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          {passwordMessage && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{passwordMessage}</p>
          )}
          {passwordError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {passwordError}
            </p>
          )}
          <FormField
            id="currentPassword"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
            autoComplete="current-password"
          />
          <FormField
            id="newPassword"
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-full border border-aura-300 px-6 py-2.5 text-sm font-semibold text-aura-800 transition hover:border-aura-400 disabled:opacity-60"
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-red-900">Delete account</h2>
        <p className="mt-1 text-sm text-red-800/80">
          This permanently removes your account and all active sessions. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 text-sm font-semibold text-red-700 underline-offset-4 hover:underline"
          >
            I want to delete my account
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            {deleteError && (
              <p className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">
                {deleteError}
              </p>
            )}
            <FormField
              id="deletePassword"
              label="Confirm with your password"
              type="password"
              value={deletePassword}
              onChange={setDeletePassword}
              required
              autoComplete="current-password"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                className="rounded-full px-6 py-2.5 text-sm font-medium text-aura-700 hover:text-aura-950"
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
