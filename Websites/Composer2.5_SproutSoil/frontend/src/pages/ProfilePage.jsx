import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { avatarSrc, formatMoney, invoiceApi, userApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

function Avatar({ user, size = "lg" }) {
  const src = avatarSrc(user?.profile_picture_url);
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-9 w-9 text-sm";

  if (src) {
    return (
      <img
        src={src}
        alt={user.username}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-soil-200`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center rounded-full bg-sprout-500 font-bold text-white`}
    >
      {user.username.charAt(0).toUpperCase()}
    </span>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
  });
  const [pictureUrl, setPictureUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  useEffect(() => {
    invoiceApi.list().then(setInvoices).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || "",
      });
      setPictureUrl(user.profile_picture_url || "");
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const updated = await userApi.updateProfile({
        username: form.username,
        email: form.email || null,
        full_name: form.full_name || null,
      });
      updateUser(updated);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUrlSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const updated = await userApi.setPictureUrl(pictureUrl.trim());
      updateUser(updated);
      setMessage("Profile picture URL updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setUploading(true);
    try {
      const updated = await userApi.uploadPicture(file);
      updateUser(updated);
      setPictureUrl(updated.profile_picture_url || "");
      setMessage("Profile picture uploaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This cannot be undone."
    );
    if (!confirmed) return;

    setError("");
    try {
      await userApi.deleteAccount();
      await logout();
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-soil-950">My Profile</h1>
      <p className="mt-2 text-soil-600">View and manage your account information.</p>

      <div className="mt-8 flex items-center gap-5 rounded-2xl border border-soil-200 bg-white p-6">
        <Avatar user={user} />
        <div>
          <p className="font-display text-xl font-bold text-soil-900">{user.username}</p>
          <p className="text-sm text-soil-500 capitalize">
            Role: {user.role === "admin" ? "Administrator" : "Standard user"}
          </p>
          <p className="text-sm font-medium text-sprout-600">
            Balance: {formatMoney(user.balance ?? 0)}
          </p>
          {user.email && <p className="text-sm text-soil-600">{user.email}</p>}
        </div>
      </div>

      {message && (
        <p className="mt-6 rounded-lg bg-sprout-500/10 px-4 py-3 text-sm text-sprout-700 ring-1 ring-sprout-500/20">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <section className="mt-10 rounded-2xl border border-soil-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-soil-900">Profile details</h2>
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-soil-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              value={form.username}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-soil-200 px-4 py-2.5 focus:border-sprout-500 focus:outline-none focus:ring-2 focus:ring-sprout-500/20"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-soil-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-soil-200 px-4 py-2.5 focus:border-sprout-500 focus:outline-none focus:ring-2 focus:ring-sprout-500/20"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-soil-700">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-soil-200 px-4 py-2.5 focus:border-sprout-500 focus:outline-none focus:ring-2 focus:ring-sprout-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-soil-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-soil-200 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-soil-900">Profile picture</h2>

        <form onSubmit={handlePictureUrlSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="picture_url" className="block text-sm font-medium text-soil-700">
              Image URL
            </label>
            <input
              id="picture_url"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={pictureUrl.startsWith("/uploads") ? "" : pictureUrl}
              onChange={(e) => setPictureUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-soil-200 px-4 py-2.5 focus:border-sprout-500 focus:outline-none focus:ring-2 focus:ring-sprout-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !pictureUrl.trim() || pictureUrl.startsWith("/uploads")}
            className="rounded-full bg-soil-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-soil-700 disabled:opacity-60"
          >
            Set from URL
          </button>
        </form>

        <div className="mt-6 border-t border-soil-100 pt-6">
          <label className="block text-sm font-medium text-soil-700">
            Or upload a file
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            disabled={uploading}
            className="mt-2 block w-full text-sm text-soil-600 file:mr-4 file:rounded-full file:border-0 file:bg-sprout-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sprout-600"
          />
          <p className="mt-1 text-xs text-soil-500">JPEG, PNG, GIF, or WebP — max 5 MB</p>
        </div>
      </section>

      {invoices.length > 0 && (
        <section className="mt-8 rounded-2xl border border-soil-200 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-soil-900">Purchase invoices</h2>
          <p className="mt-1 text-sm text-soil-500">Download PDF invoices for past orders.</p>
          <ul className="mt-4 divide-y divide-soil-100">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3 gap-4">
                <div>
                  <p className="font-medium text-soil-900">{inv.invoice_number}</p>
                  <p className="text-sm text-soil-500">
                    {new Date(inv.created_at).toLocaleDateString()} · {formatMoney(inv.total)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={downloadingInvoice === inv.invoice_number}
                  onClick={async () => {
                    setDownloadingInvoice(inv.invoice_number);
                    try {
                      await invoiceApi.downloadPdf(inv.invoice_number);
                    } catch (err) {
                      setError(err.message);
                    } finally {
                      setDownloadingInvoice(null);
                    }
                  }}
                  className="shrink-0 rounded-full border border-soil-200 px-4 py-1.5 text-sm font-medium text-soil-700 hover:bg-soil-50 disabled:opacity-60"
                >
                  {downloadingInvoice === inv.invoice_number ? "…" : "PDF"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-display text-lg font-bold text-red-900">Danger zone</h2>
        <p className="mt-2 text-sm text-red-800/80">
          Permanently delete your account and all active sessions.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="mt-4 rounded-full bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete my account
        </button>
      </section>
    </div>
  );
}
