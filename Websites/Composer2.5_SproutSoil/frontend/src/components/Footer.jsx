export default function Footer() {
  return (
    <footer id="footer" className="border-t border-soil-200 bg-soil-900 text-soil-300">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-display text-xl font-bold text-white">
              SproutSoil
            </p>
            <p className="mt-2 text-sm text-soil-400 max-w-sm">
              Smart indoor gardening for modern kitchens. Fresh herbs, zero
              guesswork.
            </p>
          </div>

          <div className="flex gap-8 text-sm">
            <a href="#products" className="hover:text-white transition-colors">
              Shop
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-soil-700 pt-6 text-center text-xs text-soil-500">
          © {new Date().getFullYear()} SproutSoil. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
