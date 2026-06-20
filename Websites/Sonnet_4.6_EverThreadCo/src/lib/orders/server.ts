import { prisma } from "@/lib/prisma";

const orderInclude = {
  items: { orderBy: { productName: "asc" as const } },
  user: {
    select: {
      username: true,
      email: true,
      displayName: true,
    },
  },
} as const;

export async function getOrderForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });
}

export async function listOrdersForUser(userId: string, limit = 20) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        select: { id: true, quantity: true },
      },
    },
  });
}
