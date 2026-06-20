import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: product ? `Edit ${product.name} | Admin` : "Product not found | Admin",
  };
}

export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm font-medium text-sage-700 hover:text-sage-900"
      >
        ← All products
      </Link>
      <h2 className="mt-4 font-display text-2xl font-semibold text-sage-900">{product.name}</h2>
      <p className="mt-1 text-sm text-sage-600">Update catalog details and availability.</p>
      <div className="mt-8">
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  );
}
