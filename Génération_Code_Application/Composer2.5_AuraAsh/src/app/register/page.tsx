import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="text-center">
        <h1 className="font-display text-4xl font-medium text-charcoal">
          Join AuraAsh
        </h1>
        <p className="mt-2 text-sm text-stone">
          Create an account to save your profile and preferences.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-stone/15 bg-cream p-8">
        <RegisterForm />
      </div>
    </div>
  );
}
