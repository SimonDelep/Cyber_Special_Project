import ProductCard, { type ProductCardData } from "./ProductCard";

type Props = {
  products: ProductCardData[];
};

export default function ProductGrid(props: Props) {
  const { products } = props;

  return (
    <section id="products" class="py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Shop the collection
            </h2>
            <p class="mt-2 max-w-xl text-muted">
              Glass meal prep containers and leak-proof bentos — stackable,
              commute-ready, and built for professional kitchens at home.
            </p>
          </div>
          <div class="flex flex-col items-start gap-2 sm:items-end">
            <p class="text-sm text-muted">
              {products.length} products · prices in CAD
            </p>
            <a
              href="/catalog"
              class="text-sm font-semibold text-brand-700 hover:underline"
            >
              View full catalog →
            </a>
          </div>
        </div>

        {products.length > 0 ? (
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard product={product} />
            ))}
          </div>
        ) : (
          <p class="mt-10 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-8 text-center text-muted">
            No products yet. Run{" "}
            <code class="rounded bg-white px-1.5 py-0.5 text-sm text-brand-800">
              npm run db:setup
            </code>{" "}
            to seed the local database.
          </p>
        )}
      </div>
    </section>
  );
}
