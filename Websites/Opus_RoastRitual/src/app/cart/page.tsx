import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata = {
  title: "Cart | RoastRitual",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl text-espresso">Your cart</h1>
      <p className="mt-2 text-sm text-espresso/70">
        Review your items and complete a simulated checkout using your account
        balance.
      </p>
      <div className="mt-10">
        <CartPageClient />
      </div>
    </div>
  );
}
