import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        email: form.email || undefined,
        full_name: form.full_name || undefined,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-soil-950">Create account</h1>
      <p className="mt-2 text-soil-600">
        Already have an account?{" "}
        <Link to="/login" className="text-sprout-600 hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

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
          <p className="mt-1 text-xs text-soil-500">Letters, numbers, and underscores only</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-soil-700">
            Email (optional)
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
            Full name (optional)
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-soil-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-soil-200 px-4 py-2.5 focus:border-sprout-500 focus:outline-none focus:ring-2 focus:ring-sprout-500/20"
          />
          <p className="mt-1 text-xs text-soil-500">At least 8 characters</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-sprout-500 py-3 text-sm font-semibold text-white hover:bg-sprout-600 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
