export default function Footer() {
  return (
    <footer className="border-t border-forest-200/60 bg-forest-800 px-6 py-12 text-forest-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-white">PureRoots</p>
          <p className="mt-2 max-w-sm text-sm text-forest-200">
            Sustainable essentials for a lighter footprint. Built with care in Québec.
          </p>
        </div>
        <p className="text-sm text-forest-200">
          © {new Date().getFullYear()} PureRoots. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
