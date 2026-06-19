"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim().toLowerCase(),
        email: form.email,
        displayName: form.displayName || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.details) {
        setFieldErrors(data.details);
      }
      setError(data.error ?? "Registration failed");
      return;
    }

    const signInResult = await signIn("credentials", {
      username: form.username.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Join EverThread Co with a username and password."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <Input
          label="Username"
          name="username"
          autoComplete="username"
          required
          value={form.username}
          onChange={(e) => updateField("username", e.target.value)}
          error={fieldErrors.username?.[0]}
        />
        <p className="-mt-3 text-xs text-sand-500">
          Lowercase letters, numbers, and underscores only.
        </p>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          error={fieldErrors.email?.[0]}
        />
        <Input
          label="Display name (optional)"
          name="displayName"
          autoComplete="name"
          value={form.displayName}
          onChange={(e) => updateField("displayName", e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          error={fieldErrors.password?.[0]}
        />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          error={fieldErrors.confirmPassword?.[0]}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Register"}
        </Button>

        <p className="text-center text-sm text-sand-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sage-700 hover:text-sage-900">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
