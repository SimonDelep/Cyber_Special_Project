export default function Footer() {
  return (
    <footer id="about" className="border-t border-aura-200 bg-aura-950 text-aura-200">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl font-semibold text-aura-50">AuraWear</p>
            <p className="mt-2 max-w-xs text-sm text-aura-400">
              Modern clothing for every moment. Crafted with care, designed to inspire.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-medium text-aura-100">Shop</p>
              <ul className="mt-3 space-y-2 text-aura-400">
                <li>
                  <a href="#shop" className="transition hover:text-aura-100">
                    New arrivals
                  </a>
                </li>
                <li>
                  <a href="#collections" className="transition hover:text-aura-100">
                    Collections
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-aura-100">Help</p>
              <ul className="mt-3 space-y-2 text-aura-400">
                <li>
                  <span>Shipping</span>
                </li>
                <li>
                  <span>Returns</span>
                </li>
                <li>
                  <span>Contact</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-aura-800 pt-8 text-center text-xs text-aura-500">
          © {new Date().getFullYear()} AuraWear. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
