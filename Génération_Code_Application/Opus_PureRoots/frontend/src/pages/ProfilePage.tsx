import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../api/admin";
import * as authApi from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"url" | "file">("url");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.full_name ?? "");
      setBio(user.bio ?? "");
      setPhone(user.phone ?? "");
      setAvatarUrl(
        user.avatar_url?.startsWith("http") ? user.avatar_url : ""
      );
    }
  }, [user]);

  if (!user) return null;

  const profile = user;
  const displayAvatar = authApi.avatarSrc(profile.avatar_url);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        email,
        full_name: fullName,
        bio,
        phone,
        ...(password ? { password } : {}),
      });
      setUser(updated);
      setPassword("");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUrl(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await authApi.setAvatarUrl(avatarUrl);
      setUser(updated);
      await refreshUser();
      setMessage("Profile picture updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const updated = await authApi.uploadAvatar(file);
      setUser(updated);
      await refreshUser();
      setMessage("Profile picture uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
      e.currentTarget.value = "";
    }
  }

  async function handleDeleteAccount() {
    const username = profile.username;
    if (deleteConfirm !== username) {
      setError(`Type your username "${username}" to confirm deletion.`);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await authApi.deleteAccount();
      setUser(null);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-800">My profile</h1>
      <p className="mt-2 text-stone-600">
        Signed in as <strong>@{user.username}</strong>
        {user.role === "admin" && (
          <span className="ml-2 rounded-full bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-700">
            Admin
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-stone-600">
        Account balance: <strong className="text-forest-700">{formatMoney(user.balance)}</strong>
      </p>

      {message && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <section className="mt-10 rounded-2xl border border-forest-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-forest-800">Profile picture</h2>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-2xl font-semibold text-forest-600">
            {displayAvatar ? (
              <img src={displayAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              user.username.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setAvatarMode("url")}
              className={`rounded-full px-3 py-1 ${avatarMode === "url" ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700"}`}
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setAvatarMode("file")}
              className={`rounded-full px-3 py-1 ${avatarMode === "file" ? "bg-forest-600 text-white" : "bg-forest-100 text-forest-700"}`}
            >
              Upload file
            </button>
          </div>
        </div>

        {avatarMode === "url" ? (
          <form onSubmit={handleAvatarUrl} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="flex-1 rounded-lg border border-forest-200 px-4 py-2.5 text-sm focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
            <button
              type="submit"
              disabled={saving || !avatarUrl}
              className="rounded-full bg-forest-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
            >
              Save URL
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <label className="inline-block cursor-pointer rounded-full bg-forest-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-700">
              Choose image (max 5 MB)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFile}
                disabled={saving}
              />
            </label>
          </div>
        )}
      </section>

      <form
        onSubmit={handleProfileSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-forest-200/80 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-forest-800">Account details</h2>

        <div>
          <label className="block text-sm font-medium text-forest-700">Username</label>
          <input
            type="text"
            value={user.username}
            disabled
            className="mt-1 w-full rounded-lg border border-forest-200 bg-forest-50 px-4 py-2.5 text-stone-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-forest-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-forest-700">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-forest-700">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-forest-700">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-forest-700">
            New password (leave blank to keep current)
          </label>
          <input
            id="password"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-forest-600 px-8 py-3 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="mt-10 rounded-2xl border border-red-200/80 bg-red-50/50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Delete account</h2>
        <p className="mt-2 text-sm text-red-800">
          This permanently removes your profile and ends all active sessions. Type your
          username to confirm.
        </p>
        <input
          type="text"
          placeholder={user.username}
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
            className="rounded-full border border-forest-300 px-5 py-2.5 text-sm font-medium text-forest-700 hover:bg-white"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirm !== user.username}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </div>
      </section>
    </div>
  );
}
