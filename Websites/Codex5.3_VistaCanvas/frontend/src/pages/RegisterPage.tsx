import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/profile" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({
        username,
        email,
        password,
        full_name: fullName || undefined,
      });
      navigate("/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Join VistaCanvas to save your profile and orders."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-sm bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        <label className="block text-sm">
          <span className="text-mist/70">Username</span>
          <input
            type="text"
            required
            pattern="[a-zA-Z0-9_]+"
            minLength={3}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-mist outline-none focus:border-gold/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mist/70">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-mist outline-none focus:border-gold/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mist/70">Full name (optional)</span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-mist outline-none focus:border-gold/50"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mist/70">Password (min. 8 characters)</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-ink px-3 py-2 text-mist outline-none focus:border-gold/50"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-gold py-2.5 text-sm font-medium text-ink transition hover:bg-gold/90 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-mist/60">
        Already have an account?{" "}
        <Link to="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
