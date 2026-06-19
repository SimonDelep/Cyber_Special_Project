import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/profile" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username,
        email,
        password,
        full_name: fullName || undefined,
      });
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-forest-800">Create account</h1>
      <p className="mt-2 text-stone-600">Join PureRoots and manage your profile.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-forest-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
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
            Full name (optional)
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
          <label htmlFor="password" className="block text-sm font-medium text-forest-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-forest-700">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-forest-200 px-4 py-2.5 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-200"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-forest-600 py-3 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-forest-600 hover:text-forest-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
