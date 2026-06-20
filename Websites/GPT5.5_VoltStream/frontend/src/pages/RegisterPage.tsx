import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, fullName, password);
      navigate("/cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Create account</h1>
      <p className="mt-2 text-grid-muted">Join GamerGrid and save your cart across devices.</p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-grid-muted">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            minLength={2}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-4 py-2.5 text-white outline-none focus:border-grid-cyan"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-grid-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-4 py-2.5 text-white outline-none focus:border-grid-cyan"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-grid-muted">
            Password (min. 8 characters)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-grid-border bg-grid-surface px-4 py-2.5 text-white outline-none focus:border-grid-cyan"
          />
        </div>
        {error && <p className="text-sm text-amber-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-grid-cyan to-grid-purple py-3 font-semibold text-grid-dark disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-grid-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-grid-cyan hover:underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
