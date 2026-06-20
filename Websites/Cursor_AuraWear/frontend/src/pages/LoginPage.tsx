import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/profile";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-aura-950">Sign in</h1>
      <p className="mt-2 text-sm text-aura-600">Welcome back to AuraWear.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <FormField
          id="username"
          label="Username"
          value={username}
          onChange={setUsername}
          required
          autoComplete="username"
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-aura-950 py-3 text-sm font-semibold text-aura-50 transition hover:bg-aura-800 disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-aura-600">
        No account?{" "}
        <Link to="/register" className="font-semibold text-aura-800 hover:text-aura-950">
          Create one
        </Link>
      </p>
    </>
  );
}
