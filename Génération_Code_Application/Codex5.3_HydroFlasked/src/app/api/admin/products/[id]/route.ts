import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { requireAdmin } from "@/lib/auth/admin";
import { adminProductSchema, formatZodErrors } from "@/lib/admin/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = adminProductSchema.partial().safeParse(body);

  if (!parsed.success) {
    return jsonError(formatZodErrors(parsed.error));
  }

  const target = await prisma.product.findUnique({ where: { id } });
  if (!target) return jsonError("Product not found", 404);

  const data = parsed.data;

  if (data.slug && data.slug !== target.slug) {
    const taken = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (taken) return jsonError("Product slug is already in use", 409);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priceCents !== undefined && { priceCents: data.priceCents }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.inStock !== undefined && { inStock: data.inStock }),
    },
  });

  await logEvent({
    category: "ADMIN",
    action: AuditAction.ADMIN_PRODUCT_UPDATE,
    status: "SUCCESS",
    message: `Admin "${admin.username}" updated product "${product.name}"`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId: product.id, changes: data },
  });

  return jsonOk({ product });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const target = await prisma.product.findUnique({ where: { id } });
  if (!target) return jsonError("Product not found", 404);

  await prisma.product.delete({ where: { id } });

  await logEvent({
    category: "ADMIN",
    action: AuditAction.ADMIN_PRODUCT_DELETE,
    status: "SUCCESS",
    message: `Admin "${admin.username}" deleted product "${target.name}"`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId: target.id, slug: target.slug },
  });

  return jsonOk({ success: true });
}
