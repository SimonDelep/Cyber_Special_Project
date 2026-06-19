import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/api";
import { resolveCart } from "@/lib/cart/server";
import { getCartLines } from "@/lib/cart/cookie";
import { jsonWithCart } from "@/lib/cart/response";
import { formatPrice } from "@/lib/utils";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";
import { generateOrderNumber } from "@/lib/orders/number";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to complete checkout", 401);

  const cart = await resolveCart();
  const rawLines = await getCartLines();

  if (rawLines.length === 0 || cart.items.length === 0) {
    return jsonError("Your cart is empty", 400);
  }

  const outOfStock = cart.items.filter((i) => !i.inStock);
  if (outOfStock.length > 0) {
    return jsonError(
      `Out of stock: ${outOfStock.map((i) => i.name).join(", ")}`,
      400,
    );
  }

  if (cart.items.length !== rawLines.length) {
    return jsonError("Some items in your cart are no longer available", 400);
  }

  const total = cart.subtotal;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });

      if (!dbUser) throw new Error("USER_NOT_FOUND");

      const balance = Number(dbUser.balance);

      if (balance < total) {
        throw new Error(`INSUFFICIENT_BALANCE:${balance}:${total}`);
      }

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: balance - total },
        select: { balance: true },
      });

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          total,
          status: "COMPLETED",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.name,
              productSlug: item.slug,
              unitPrice: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      return {
        newBalance: Number(updated.balance),
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    });

    await logEvent({
      level: LogLevel.SUCCESS,
      category: LogCategory.TRANSACTION,
      action: LOG_ACTIONS.CHECKOUT_SUCCESS,
      message: `Checkout completed by "${user.username}" for ${formatPrice(total)} — ${result.orderNumber}`,
      userId: user.id,
      username: user.username,
      metadata: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        orderTotal: total,
        newBalance: result.newBalance,
        itemCount: cart.itemCount,
      },
      request,
    });

    return jsonWithCart(
      {
        message:
          "Checkout complete! Your order has been simulated successfully.",
        orderTotal: total,
        newBalance: result.newBalance,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
      },
      [],
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("INSUFFICIENT_BALANCE:")) {
        const [, balanceStr, totalStr] = error.message.split(":");
        const balance = parseFloat(balanceStr);
        const orderTotal = parseFloat(totalStr);

        await logEvent({
          level: LogLevel.WARN,
          category: LogCategory.TRANSACTION,
          action: LOG_ACTIONS.CHECKOUT_INSUFFICIENT,
          message: `Checkout failed for "${user.username}" — insufficient balance (${formatPrice(balance)} < ${formatPrice(orderTotal)})`,
          userId: user.id,
          username: user.username,
          metadata: { balance, orderTotal },
          request,
        });

        return jsonError(
          `Insufficient balance. You have ${formatPrice(balance)} but your order total is ${formatPrice(orderTotal)}. Please add funds or remove items.`,
          402,
        );
      }
    }

    await logEvent({
      level: LogLevel.ERROR,
      category: LogCategory.TRANSACTION,
      action: LOG_ACTIONS.CHECKOUT_FAILED,
      message: `Checkout failed for "${user.username}"`,
      userId: user.id,
      username: user.username,
      request,
    });

    console.error("[checkout POST]", error);
    return jsonError("Checkout failed. Please try again.", 500);
  }
}
