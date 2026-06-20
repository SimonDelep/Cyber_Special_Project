import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { productSchema } from "@/lib/admin/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

export async function GET() {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess({
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const { slug, name, description, price, category, featured, inStock, imageUrl } =
      parsed.data;

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) return jsonError("Product slug already exists", 409);

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description,
        price,
        category,
        featured: featured ?? false,
        inStock: inStock ?? true,
        imageUrl: imageUrl || null,
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.ADMIN,
      action: LOG_ACTIONS.ADMIN_PRODUCT_CREATE,
      message: `Admin "${auth.user.username}" created product "${product.name}"`,
      userId: auth.user.id,
      username: auth.user.username,
      metadata: { productId: product.id, slug: product.slug },
      request,
    });

    return jsonSuccess(
      {
        product: { ...product, price: Number(product.price) },
        message: "Product created",
      },
      201,
    );
  } catch {
    return jsonError("Failed to create product", 500);
  }
}
