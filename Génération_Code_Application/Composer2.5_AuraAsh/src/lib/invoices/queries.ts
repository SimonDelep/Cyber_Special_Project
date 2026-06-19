import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/utils";
import type { InvoiceData } from "./types";

function serializeOrder(order: {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  total: { toString(): string };
  balanceAfter: { toString(): string };
  user: {
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: { toString(): string };
    lineTotal: { toString(): string };
  }[];
}): InvoiceData {
  return {
    invoiceNumber: order.invoiceNumber,
    orderId: order.id,
    createdAt: order.createdAt,
    customer: order.user,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      lineTotal: decimalToNumber(item.lineTotal),
    })),
    total: decimalToNumber(order.total),
    balanceAfter: decimalToNumber(order.balanceAfter),
  };
}

const orderInclude = {
  items: true,
  user: {
    select: {
      username: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

export async function getInvoiceData(
  orderId: string,
  userId: string,
): Promise<InvoiceData | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });

  if (!order) return null;
  return serializeOrder(order);
}

export async function getInvoiceDataByOrderId(
  orderId: string,
): Promise<InvoiceData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) return null;
  return serializeOrder(order);
}
