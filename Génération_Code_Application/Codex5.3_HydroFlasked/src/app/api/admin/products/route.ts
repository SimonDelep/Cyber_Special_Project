import { AuditAction } from "@/lib/audit/actions";
import { logEvent } from "@/lib/audit/logger";
import { requireAdmin } from "@/lib/auth/admin";
import { adminProductSchema, formatZodErrors } from "@/lib/admin/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return jsonOk({ products });
}

export async function POST(request: Request) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = adminProductSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(formatZodErrors(parsed.error));
  }

  const data = parsed.data;
  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) return jsonError("Product slug is already in use", 409);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      priceCents: data.priceCents,
      category: data.category,
      imageUrl: data.imageUrl || null,
      featured: data.featured ?? false,
      inStock: data.inStock ?? true,
    },
  });

  await logEvent({
    category: "ADMIN",
    action: AuditAction.ADMIN_PRODUCT_CREATE,
    status: "SUCCESS",
    message: `Admin "${admin.username}" created product "${product.name}"`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: { productId: product.id, slug: product.slug },
  });

  return jsonOk({ product }, 201);
}
