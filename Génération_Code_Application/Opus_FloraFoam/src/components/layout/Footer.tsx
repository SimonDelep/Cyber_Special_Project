import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-sage-200/60 bg-sage-900 text-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-cream-50">FloraFoam</p>
          <p className="mt-2 max-w-sm text-sm text-sage-200">
            Plant-based, cruelty-free skincare—serums, night creams, and eye patches rooted in
            botanical science.
          </p>
        </div>
        <p className="text-sm text-sage-300">
          © {new Date().getFullYear()} FloraFoam. All rights reserved.
        </p>
        <Link href="/" className="text-sm text-sage-300 hover:text-cream-50">
          Back to top
        </Link>
      </div>
    </footer>
  );
}
