import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError, resolveAvatarUrl } from "../api/client";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import type { SessionInfo } from "../types/user";

function ProfileContent() {
  const { user, refreshUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email);
    setFullName(user.full_name ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatar_url ?? "");
    api.getSessions().then(setSessions).catch(() => {});
  }, [user]);

  if (!user) return null;

  const avatar = resolveAvatarUrl(user.avatar_url);

  async function handleProfileUpdate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.updateProfile({
        email,
        full_name: fullName || null,
        bio: bio || null,
        password: newPassword || undefined,
      });
      await refreshUser();
      setNewPassword("");
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatarUrl(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.setAvatarUrl(avatarUrl);
      await refreshUser();
      setMessage("Avatar URL saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to set avatar URL");
    } finally {
      setBusy(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.uploadAvatar(file);
      await refreshUser();
      setMessage("Avatar uploaded.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault();
    if (!confirm("Delete your account permanently? This cannot be undone.")) {
      return;
    }
    setError("");
    setBusy(true);
    try {
      await api.deleteAccount(deletePassword);
      await logout();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Deletion failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 pb-16 pt-28">
        <h1 className="font-display text-4xl text-mist">My profile</h1>
        <p className="mt-2 text-sm text-mist/60">
          @{user.username} · {user.role}
          {isAdmin && " · administrator"}
        </p>
        <p className="mt-1 text-lg text-gold">
          Account balance: ${Number(user.balance).toFixed(2)}
        </p>
        {isAdmin && (
          <Link
            to="/admin"
            className="mt-2 inline-block text-sm text-gold hover:underline"
          >
            Open admin panel →
          </Link>
        )}

        {(message || error) && (
          <div
            className={`mt-6 rounded-sm px-4 py-3 text-sm ${
              error
                ? "bg-red-950/50 text-red-200"
                : "bg-fog/20 text-mist"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="mt-10 rounded-sm border border-white/5 bg-deep/50 p-6">
          <h2 className="font-display text-xl text-gold">Profile picture</h2>
          <div className="mt-4 flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-2 ring-gold/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink text-2xl text-gold">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 space-y-3">
              <label className="block text-sm">
                <span className="text-mist/70">Upload image file</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  disabled={busy}
                  className="mt-1 block w-full text-sm text-mist/70 file:mr-3 file:rounded-sm file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:text-ink"
                />
              </label>
              <form onSubmit={handleAvatarUrl} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl.startsWith("/uploads") ? "" : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm outline-none focus:border-gold/50"
                />
                <button
                  type="submit"
                  disabled={busy || !avatarUrl}
                  className="rounded-sm border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  Set URL
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-sm border border-white/5 bg-deep/50 p-6">
          <h2 className="font-display text-xl text-gold">Profile details</h2>
          <form onSubmit={handleProfileUpdate} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-mist/70">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-mist/70">Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-mist/70">Bio</span>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
              />
            </label>
            <label className="block text-sm">
              <span className="text-mist/70">New password (leave blank to keep)</span>
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 outline-none focus:border-gold/50"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm bg-gold px-6 py-2 text-sm font-medium text-ink hover:bg-gold/90 disabled:opacity-50"
            >
              Save changes
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-sm border border-white/5 bg-deep/50 p-6">
          <h2 className="font-display text-xl text-gold">Active sessions</h2>
          <ul className="mt-3 space-y-2 text-sm text-mist/70">
            {sessions.length === 0 && <li>No active sessions.</li>}
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-sm bg-ink/50 px-3 py-2"
              >
                <span>
                  Session #{s.id}
                  {s.is_current && (
                    <span className="ml-2 text-gold">(current)</span>
                  )}
                </span>
                <span className="text-xs">
                  expires {new Date(s.expires_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-sm border border-red-900/30 bg-red-950/20 p-6">
          <h2 className="font-display text-xl text-red-200">Delete account</h2>
          <p className="mt-2 text-sm text-mist/60">
            Permanently remove your account and all sessions.
          </p>
          <form onSubmit={handleDeleteAccount} className="mt-4 flex gap-2">
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="flex-1 rounded-sm border border-white/10 bg-ink px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm bg-red-900/80 px-4 py-2 text-sm text-red-100 hover:bg-red-900 disabled:opacity-50"
            >
              Delete
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
