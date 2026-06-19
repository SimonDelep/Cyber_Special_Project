"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { getCartSummary, lineTotalCents } from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import type { ActionState } from "@/lib/action-state";
import { AuditAction, logAuditEventWithRequest } from "@/lib/audit";
import { toActionError } from "@/lib/errors";

export async function placeOrderAction(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const userId = session.user.id;
  const { items, totalCents } = await getCartSummary(userId);

  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }

  for (const item of items) {
    if (item.product.stock != null && item.quantity > item.product.stock) {
      return {
        error: `Not enough stock for ${item.product.name}.`,
      };
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceCents: true },
  });

  if (!user) {
    return { error: "Account not found." };
  }

  if (user.balanceCents < totalCents) {
    return {
      error: `Insufficient balance. You need ${((totalCents - user.balanceCents) / 100).toFixed(2)} CAD more store credit.`,
    };
  }

  let orderId: string;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id: userId },
        select: { balanceCents: true },
      });
      if (!freshUser || freshUser.balanceCents < totalCents) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      for (const item of items) {
        if (item.product.stock != null) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`OUT_OF_STOCK:${item.product.name}`);
          }
        }
      }

      const created = await tx.order.create({
        data: {
          userId,
          totalCents,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPriceCents: lineTotalCents(item.product.price, 1),
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balanceCents: { decrement: totalCents } },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      return created;
    });

    orderId = order.id;

    await logAuditEventWithRequest({
      action: AuditAction.ORDER_PLACED,
      userId,
      userEmail: session.user.email,
      resourceType: "order",
      resourceId: order.id,
      details: {
        totalCents: order.totalCents,
        itemCount: order.items.length,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INSUFFICIENT_BALANCE") {
        return { error: "Insufficient store credit balance." };
      }
      if (err.message.startsWith("OUT_OF_STOCK:")) {
        return {
          error: `${err.message.replace("OUT_OF_STOCK:", "")} is out of stock.`,
        };
      }
    }
    return toActionError(err);
  }

  const newBalance = user.balanceCents - totalCents;
  await unstable_update({
    user: { balanceCents: newBalance },
  });

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/account");
  revalidatePath("/account/orders");
  revalidatePath("/shop");

  redirect(`/account/orders?placed=${orderId}`);
}
