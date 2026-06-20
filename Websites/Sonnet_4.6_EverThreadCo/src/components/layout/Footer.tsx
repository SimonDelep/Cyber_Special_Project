import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sand-200 bg-sand-900 text-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-2xl text-cream-50">EverThread Co</p>
          <p className="mt-2 max-w-sm text-sm text-sand-300">
            Timeless wardrobe basics — 100% certified organic Egyptian cotton
            and recycled fibers.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-sand-300">
          <Link href="#shop" className="hover:text-cream-50">
            Shop
          </Link>
          <Link href="#fibers" className="hover:text-cream-50">
            Materials
          </Link>
          <Link href="#newsletter" className="hover:text-cream-50">
            Newsletter
          </Link>
        </div>
      </div>

      <div className="border-t border-sand-800 px-6 py-4 text-center text-xs text-sand-400">
        © {year} EverThread Co. All rights reserved.
      </div>
    </footer>
  );
}
