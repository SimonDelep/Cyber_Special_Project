import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
      <p className="mt-2 text-sm text-muted">Join AeroPure to manage your profile</p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
