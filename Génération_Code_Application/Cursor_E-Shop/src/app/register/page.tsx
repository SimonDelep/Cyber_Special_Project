import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { RegisterForm } from "@/components/forms/AuthForm";
import { registerAction } from "@/actions/auth";

export default function RegisterPage() {
  return (
    <PageShell narrow>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8">
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Join E-Shop as a customer. Admins are created via seed or by an existing admin.
        </p>
        <div className="mt-8">
          <RegisterForm action={registerAction} />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
