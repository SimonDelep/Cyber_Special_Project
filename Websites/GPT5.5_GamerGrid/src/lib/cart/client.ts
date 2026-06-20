/**
 * Browser-only cart UI wiring. Imported once from BaseLayout.
 */
import {
  addToCart,
  initCart,
  subscribe,
} from '@/lib/cart';

function updateCartBadge(count: number) {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
  });
}

function syncCatalogButtons() {
  const snap = initCart();
  const ids = new Set(snap.items.map((item) => item.id));

  document.querySelectorAll<HTMLButtonElement>('[data-add-cart]').forEach((btn) => {
    const productId = btn.dataset.productId ?? '';
    const inCart = ids.has(productId);
    btn.disabled = inCart;
    btn.textContent = inCart ? 'In cart' : 'Add to cart';
  });
}

function showButtonFeedback(btn: HTMLButtonElement, message: string) {
  const feedback = btn.parentElement?.querySelector('[data-cart-feedback]');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.remove('hidden');
  window.setTimeout(() => {
    feedback.textContent = '';
    feedback.classList.add('hidden');
  }, 2000);
}

function setupCatalog() {
  const catalog = document.getElementById('product-catalog');
  if (!catalog) return;

  catalog.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-add-cart]',
    );
    if (!btn || btn.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    const id = btn.dataset.productId;
    const name = btn.dataset.productName;
    const price = btn.dataset.productPrice;
    if (!id || !name || price === undefined) return;

    const added = addToCart({
      id,
      name,
      price: Number(price),
    });

    if (added) {
      showButtonFeedback(btn, 'Added to cart!');
    }
  });
}

function boot() {
  const snap = initCart();
  updateCartBadge(snap.count);
  syncCatalogButtons();
  setupCatalog();

  subscribe((next) => {
    updateCartBadge(next.count);
    syncCatalogButtons();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
