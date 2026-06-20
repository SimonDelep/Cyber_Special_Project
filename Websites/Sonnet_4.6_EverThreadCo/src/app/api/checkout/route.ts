import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { buildCartSummary } from "@/lib/cart/types";
import { EventActions } from "@/lib/events/actions";
import { logEvent } from "@/lib/events/logger";
import { generateOrderNumber } from "@/lib/orders/number";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const actor = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { username: true },
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: auth.userId },
        select: { id: true, balanceCents: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const rows = await tx.cartItem.findMany({
        where: { userId: auth.userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              priceCents: true,
              imageUrl: true,
              inStock: true,
            },
          },
        },
      });

      if (rows.length === 0) {
        throw new Error("CART_EMPTY");
      }

      const outOfStock = rows.filter((r) => !r.product.inStock);
      if (outOfStock.length > 0) {
        throw new Error("OUT_OF_STOCK");
      }

      const cart = buildCartSummary(rows);
      const totalCents = cart.subtotalCents;

      if (user.balanceCents < totalCents) {
        return {
          ok: false as const,
          balanceCents: user.balanceCents,
          totalCents,
          shortfallCents: totalCents - user.balanceCents,
        };
      }

      const updatedUser = await tx.user.update({
        where: { id: auth.userId },
        data: { balanceCents: user.balanceCents - totalCents },
        select: { balanceCents: true },
      });

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: auth.userId,
          totalCents,
          balanceAfterCents: updatedUser.balanceCents,
          simulated: true,
          items: {
            create: rows.map((row) => ({
              productId: row.product.id,
              productName: row.product.name,
              productSlug: row.product.slug,
              unitPriceCents: row.product.priceCents,
              quantity: row.quantity,
              lineTotalCents: row.product.priceCents * row.quantity,
            })),
          },
        },
        select: {
          id: true,
          orderNumber: true,
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: auth.userId } });

      return {
        ok: true as const,
        totalCents,
        balanceCents: updatedUser.balanceCents,
        itemCount: cart.itemCount,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    });

    if (!result.ok) {
      await logEvent({
        category: "TRANSACTION",
        action: EventActions.CHECKOUT_FAILED,
        severity: "WARN",
        message: `Checkout failed (insufficient balance) for @${actor?.username ?? auth.userId}`,
        userId: auth.userId,
        username: actor?.username ?? null,
        request,
        metadata: {
          totalCents: result.totalCents,
          balanceCents: result.balanceCents,
          shortfallCents: result.shortfallCents,
        },
      });

      return NextResponse.json(
        {
          error: "Insufficient account balance",
          balanceCents: result.balanceCents,
          totalCents: result.totalCents,
          shortfallCents: result.shortfallCents,
        },
        { status: 402 },
      );
    }

    await logEvent({
      category: "TRANSACTION",
      action: EventActions.CHECKOUT_SUCCESS,
      message: `Checkout completed: ${result.itemCount} item(s), ${result.totalCents} cents charged`,
      userId: auth.userId,
      username: actor?.username ?? null,
      request,
      metadata: {
        totalCents: result.totalCents,
        balanceCents: result.balanceCents,
        itemCount: result.itemCount,
        orderId: result.orderId,
        orderNumber: result.orderNumber,
      },
    });

    return NextResponse.json({
      message: "Checkout complete (simulated)",
      totalCents: result.totalCents,
      balanceCents: result.balanceCents,
      itemCount: result.itemCount,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";

    if (code === "CART_EMPTY") {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }
    if (code === "OUT_OF_STOCK") {
      return NextResponse.json(
        { error: "One or more items are out of stock" },
        { status: 400 },
      );
    }
    if (code === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
