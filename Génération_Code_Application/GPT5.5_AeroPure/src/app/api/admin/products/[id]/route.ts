import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { productUpdateSchema } from "@/lib/admin/validation";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return jsonError("Product not found", 404);

  return jsonSuccess({
    product: { ...product, price: Number(product.price) },
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input";
      return jsonError(message, 400);
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return jsonError("Product not found", 404);

    const data = parsed.data;

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) return jsonError("Product slug already exists", 409);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.inStock !== undefined && { inStock: data.inStock }),
        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl || null,
        }),
      },
    });

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.ADMIN,
      action: LOG_ACTIONS.ADMIN_PRODUCT_UPDATE,
      message: `Admin "${auth.user.username}" updated product "${product.name}"`,
      userId: auth.user.id,
      username: auth.user.username,
      metadata: { productId: id, slug: product.slug },
      request,
    });

    return jsonSuccess({
      product: { ...product, price: Number(product.price) },
      message: "Product updated",
    });
  } catch {
    return jsonError("Failed to update product", 500);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Product not found", 404);

  await prisma.product.delete({ where: { id } });

  await logEvent({
    level: LogLevel.WARN,
    category: LogCategory.ADMIN,
    action: LOG_ACTIONS.ADMIN_PRODUCT_DELETE,
    message: `Admin "${auth.user.username}" deleted product "${existing.name}"`,
    userId: auth.user.id,
    username: auth.user.username,
    metadata: { productId: id, slug: existing.slug },
    request,
  });

  return jsonSuccess({ message: "Product deleted" });
}
