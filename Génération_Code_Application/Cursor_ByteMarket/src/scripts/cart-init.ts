import { addToCart } from "@/stores/cart";

document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>(
    "[data-add-to-cart]",
  );
  if (!button || button.disabled) return;

  const id = Number(button.dataset.productId);
  const priceCents = Number(button.dataset.productPrice);
  if (!Number.isFinite(id) || !Number.isFinite(priceCents)) return;

  addToCart({
    id,
    slug: button.dataset.productSlug ?? "",
    name: button.dataset.productName ?? "",
    priceCents,
  });

  const original = button.dataset.labelOriginal ?? button.textContent ?? "Add to cart";
  button.dataset.labelOriginal = original;
  button.textContent = "Added!";
  window.setTimeout(() => {
    button.textContent = original;
  }, 1500);
});
