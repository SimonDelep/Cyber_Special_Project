export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer class="border-t border-brand-100 bg-white py-12">
      <div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p class="font-display text-lg font-semibold text-ink">
            PrepPro Aesthetic
          </p>
          <p class="mt-1 text-sm text-muted">
            Stackable glass meal prep · Leak-proof bentos
          </p>
        </div>
        <nav class="flex flex-wrap gap-6 text-sm text-muted">
          <a href="#products" class="hover:text-brand-700">
            Shop
          </a>
          <a href="#features" class="hover:text-brand-700">
            Features
          </a>
          <a href="/api/products" class="hover:text-brand-700">
            API (dev)
          </a>
        </nav>
        <p class="text-sm text-muted">© {year} PrepPro Aesthetic</p>
      </div>
    </footer>
  );
}
