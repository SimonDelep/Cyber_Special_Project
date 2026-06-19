import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-cyan-950/80 via-zinc-900 to-violet-950/60 px-6 py-14 sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl"
          aria-hidden
        />

        <div className="relative max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to upgrade your setup?
          </h2>
          <p className="mt-4 text-zinc-400">
            Join E-Shop to manage your profile, track store credit, and get early access
            to new drops.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/register">Get started free</Button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
