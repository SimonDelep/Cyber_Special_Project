import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/forms/ProductForm";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { updateProductAction } from "@/actions/admin/products";

interface AdminProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({
  params,
}: AdminProductEditPageProps) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    notFound();
  }

  const boundAction = updateProductAction.bind(null, product.id);

  return (
    <div className="max-w-lg">
      <Link
        href="/admin/products"
        className="text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Back to products
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Edit product</h2>
        <DeleteProductButton
          productId={product.id}
          productName={product.name}
        />
      </div>
      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <ProductForm
          action={boundAction}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price: String(product.price),
            imageUrl: product.imageUrl ?? "",
            category: product.category,
            stock: product.stock != null ? String(product.stock) : "",
          }}
        />
      </div>
    </div>
  );
}
