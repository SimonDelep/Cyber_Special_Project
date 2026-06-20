export function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-white/10 bg-slate-950 py-12 text-slate-400"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">HydroFlasked</p>
            <p className="mt-1 max-w-md text-sm">
              Premium stainless steel tumblers, custom glassware, and insulated wine
              mugs — built for everyday adventure.
            </p>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} HydroFlasked. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
