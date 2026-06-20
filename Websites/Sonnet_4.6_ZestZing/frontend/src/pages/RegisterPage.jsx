import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-stone-900">Create account</h1>
          <p className="mt-2 text-stone-600 text-sm">
            Join ZestZing — username must be letters, numbers, or underscores.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{error}</p>
            )}
            <Field label="Username" id="username" value={form.username} onChange={update("username")} required />
            <Field label="Email" id="email" type="email" value={form.email} onChange={update("email")} required />
            <Field label="Password" id="password" type="password" value={form.password} onChange={update("password")} required hint="At least 8 characters" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" id="first_name" value={form.first_name} onChange={update("first_name")} />
              <Field label="Last name" id="last_name" value={form.last_name} onChange={update("last_name")} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors mt-2"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-stone-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, id, type = "text", value, onChange, required, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}
