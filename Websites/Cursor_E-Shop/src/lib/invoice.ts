import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { InvoiceOrderData } from "@/lib/invoice-pdf";

export async function getOrderForInvoice(
  orderId: string,
  userId: string,
  role: Role
): Promise<InvoiceOrderData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        select: {
          productName: true,
          quantity: true,
          unitPriceCents: true,
        },
        orderBy: { productName: "asc" },
      },
    },
  });

  if (!order) {
    return null;
  }

  if (order.userId !== userId && role !== "ADMIN") {
    return null;
  }

  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalCents: order.totalCents,
    customer: {
      name: order.user.name,
      email: order.user.email,
    },
    items: order.items,
  };
}
