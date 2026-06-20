import Link from "next/link";
import { Button } from "@/components/ui/Button";

const highlights = [
  { label: "Free shipping", value: "Over $75" },
  { label: "Warranty", value: "2 years" },
  { label: "Returns", value: "30 days" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,211,238,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Spring tech drop — new stock weekly
          </p>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Premium electronics,{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              delivered fast
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
            E-Shop hand-picks phones, laptops, audio, and gear for work and play.
            Real inventory, transparent pricing, and support you can trust.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/shop">Shop now</Button>
            <Button href="#categories" variant="secondary">
              Browse categories
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-zinc-800/80 pt-8">
            {highlights.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-zinc-100">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-transparent to-violet-600/20 blur-2xl" />
          <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
            <div className="col-span-2 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                    Best seller
                  </p>
                  <p className="mt-2 text-2xl font-bold text-zinc-50">NovaPhone X</p>
                  <p className="mt-1 text-sm text-zinc-500">Flagship · OLED · 48h battery</p>
                </div>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                  $999
                </span>
              </div>
              <div className="mt-6 flex h-32 items-center justify-center rounded-xl bg-zinc-950/80 ring-1 ring-zinc-800">
                <span className="text-6xl" aria-hidden>
                  📱
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-4">
              <span className="text-3xl" aria-hidden>
                💻
              </span>
              <p className="mt-3 text-sm font-semibold text-zinc-200">Laptops</p>
              <p className="text-xs text-zinc-500">From $1,299</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-4">
              <span className="text-3xl" aria-hidden>
                🎧
              </span>
              <p className="mt-3 text-sm font-semibold text-zinc-200">Audio</p>
              <p className="text-xs text-zinc-500">From $79</p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-zinc-600 lg:text-left">
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300">
              Create an account
            </Link>{" "}
            to track orders and store credit
          </p>
        </div>
      </div>
    </section>
  );
}
