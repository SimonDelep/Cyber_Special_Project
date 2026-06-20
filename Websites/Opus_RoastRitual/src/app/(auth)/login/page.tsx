import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in | RoastRitual",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-2xl text-espresso">Welcome back</h1>
      <p className="mt-2 text-sm text-espresso/70">
        Sign in to manage your profile and subscriptions.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-espresso/60">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </>
  );
}
