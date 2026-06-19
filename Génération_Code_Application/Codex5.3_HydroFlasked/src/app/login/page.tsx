import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="py-16 sm:py-24">
      <Suspense fallback={<p className="text-center text-slate-400">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
