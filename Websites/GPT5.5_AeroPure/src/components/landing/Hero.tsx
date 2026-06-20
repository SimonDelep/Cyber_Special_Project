import Link from "next/link";
import { Suspense } from "react";
import { WeatherChicoutimi } from "@/components/landing/WeatherChicoutimi";

function WeatherSkeleton() {
  return (
    <div
      className="h-[220px] w-full max-w-sm animate-pulse rounded-2xl border border-border bg-surface/50"
      aria-hidden
    />
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl flex-1 text-center lg:text-left">
          <p className="mb-4 inline-block rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium uppercase tracking-widest text-muted">
            Travel tech, refined
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Power every device.
            <span className="block text-accent">Travel lighter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted lg:mx-0">
            Magnetic wireless charging stations, high-capacity solar power banks,
            and sleek organizers — designed for life on the move.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link
              href="#products"
              className="w-full rounded-full bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark sm:w-auto"
            >
              Shop products
            </Link>
            <Link
              href="#features"
              className="w-full rounded-full border border-border bg-surface px-8 py-3 text-sm font-semibold transition-colors hover:bg-border/50 sm:w-auto"
            >
              Why AeroPure
            </Link>
          </div>
        </div>

        <Suspense fallback={<WeatherSkeleton />}>
          <WeatherChicoutimi />
        </Suspense>
      </div>
    </section>
  );
}
