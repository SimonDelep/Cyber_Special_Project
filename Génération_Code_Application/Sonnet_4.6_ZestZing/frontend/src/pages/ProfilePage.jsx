import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, avatarSrc, formatMoney } from "../api/client";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    current_password: "",
    new_password: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadInvoices = useCallback(() => {
    api
      .listInvoices()
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setInvoicesLoading(false));
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        current_password: "",
        new_password: "",
      });
      setAvatarUrl(user.profile_picture_url || "");
    }
  }, [user]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const body = {
        email: form.email,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
      };
      if (form.new_password) {
        body.current_password = form.current_password;
        body.new_password = form.new_password;
      }
      await api.updateProfile(body);
      await refreshUser();
      setForm((f) => ({ ...f, current_password: "", new_password: "" }));
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetAvatarUrl = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.setAvatarUrl(avatarUrl.trim());
      await refreshUser();
      setMessage("Profile picture URL saved.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const updated = await api.uploadAvatar(file);
      setAvatarUrl(updated.profile_picture_url || "");
      await refreshUser();
      setMessage("Profile picture uploaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    try {
      await api.deleteProfile();
      await logout();
      navigate("/");
    } catch (err) {
      setError(err.message);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-2xl w-full px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-stone-900">My Profile</h1>
        <p className="mt-2 text-stone-600">
          Signed in as <strong>{user.username}</strong>
          {user.role === "admin" && (
            <span className="ml-2 rounded-full bg-brand-100 text-brand-800 text-xs font-semibold px-2 py-0.5">
              Admin
            </span>
          )}
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Account balance:{" "}
          <span className="font-semibold text-brand-700">{formatMoney(user.balance)}</span>
        </p>

        {message && (
          <p className="mt-6 rounded-lg bg-green-50 text-green-800 text-sm px-4 py-3">{message}</p>
        )}
        {error && (
          <p className="mt-6 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
        )}

        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Purchase invoices</h2>
          <p className="mt-1 text-sm text-stone-500">
            Download PDF invoices for completed orders.
          </p>
          {invoicesLoading ? (
            <p className="mt-4 text-sm text-stone-500">Loading invoices…</p>
          ) : invoices.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">No purchases yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-stone-100 bg-stone-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-900">{inv.invoice_number}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(inv.created_at).toLocaleString()} · {formatMoney(inv.total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingId === inv.id}
                    onClick={async () => {
                      setDownloadingId(inv.id);
                      try {
                        await api.downloadInvoicePdf(inv.id, inv.invoice_number);
                      } catch (err) {
                        setError(err.message);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    className="shrink-0 rounded-full border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {downloadingId === inv.id ? "…" : "PDF"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Profile picture</h2>
          <div className="mt-4 flex items-center gap-6">
            {user.profile_picture_url ? (
              <img
                src={avatarSrc(user.profile_picture_url)}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-stone-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-sm">
                No photo
              </div>
            )}
            <div className="flex-1 space-y-4">
              <form onSubmit={handleSetAvatarUrl} className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900"
                >
                  Set URL
                </button>
              </form>
              <div>
                <label className="inline-block cursor-pointer rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-brand-400 hover:bg-brand-50">
                  {uploading ? "Uploading…" : "Upload image file"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                <p className="mt-1 text-xs text-stone-500">JPEG, PNG, GIF, or WebP — max 5 MB</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Account details</h2>
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Username</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-stone-500"
              />
              <p className="mt-1 text-xs text-stone-500">Username cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-stone-700">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={update("first_name")}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-stone-700">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={form.last_name}
                  onChange={update("last_name")}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <p className="text-sm font-medium text-stone-700">Change password (optional)</p>
              <div className="mt-3 space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={form.current_password}
                  onChange={update("current_password")}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 outline-none"
                />
                <input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={form.new_password}
                  onChange={update("new_password")}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-brand-600 px-8 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Delete account</h2>
          <p className="mt-2 text-sm text-red-800">
            Permanently remove your account and all active sessions. This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Yes, delete permanently
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
