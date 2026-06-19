import { Suspense } from "react";
import { ProductCatalog } from "@/components/shop/ProductCatalog";
import { prisma } from "@/lib/prisma";

export default async function ShopPage() {
  const rows = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const products = rows.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Product catalog</h1>
        <p className="mt-2 text-slate-400">
          Search and filter our full collection — open any product to read reviews or share
          your own.
        </p>
        <Suspense
          fallback={
            <p className="mt-10 text-center text-slate-500">Loading catalog…</p>
          }
        >
          <ProductCatalog products={products} />
        </Suspense>
      </div>
    </div>
  );
}
