import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      _count: { select: { items: true } },
    },
    take: 50,
  });

  return jsonSuccess({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.status,
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
