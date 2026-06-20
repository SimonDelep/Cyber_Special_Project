import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { EventCategory, EventStatus, logEvent } from "@/lib/events/logger";
import { generateInvoiceNumber } from "@/lib/invoices/numbers";
import { prisma } from "@/lib/prisma";
import { decimalToNumber, formatPrice } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations/checkout";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      await logEvent({
        category: EventCategory.TRANSACTION,
        action: "CHECKOUT_REQUEST",
        status: EventStatus.FAILURE,
        message: "Checkout denied: user not authenticated",
        request,
      });

      return NextResponse.json(
        { error: "You must be signed in to checkout" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: EventCategory.TRANSACTION,
        action: "CHECKOUT_REQUEST",
        status: EventStatus.FAILURE,
        message: "Checkout failed: invalid cart data",
        userId: user.id,
        username: user.username,
        request,
      });

      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid cart" },
        { status: 400 },
      );
    }

    await logEvent({
      category: EventCategory.TRANSACTION,
      action: "CHECKOUT_REQUEST",
      status: EventStatus.WARNING,
      message: `Checkout initiated by "${user.username}"`,
      userId: user.id,
      username: user.username,
      metadata: {
        itemCount: parsed.data.items.length,
        balance: user.balance,
      },
      request,
    });

    const productIds = parsed.data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const orderItems: { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[] = [];

    for (const item of parsed.data.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return NextResponse.json(
          { error: "One or more products in your cart are no longer available" },
          { status: 400 },
        );
      }

      if (!product.inStock) {
        return NextResponse.json(
          { error: `"${product.name}" is out of stock` },
          { status: 400 },
        );
      }

      const unitPrice = decimalToNumber(product.price);
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: roundMoney(unitPrice * item.quantity),
      });
    }

    const total = roundMoney(
      orderItems.reduce((sum, item) => sum + item.lineTotal, 0),
    );

    const result = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: user.id } });
      if (!freshUser) {
        throw new Error("USER_NOT_FOUND");
      }

      const balance = decimalToNumber(freshUser.balance);

      if (balance < total) {
        return {
          ok: false as const,
          balance,
          total,
        };
      }

      const newBalance = roundMoney(balance - total);

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
        select: { balance: true },
      });

      const order = await tx.order.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          userId: user.id,
          total,
          balanceAfter: newBalance,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        select: {
          id: true,
          invoiceNumber: true,
        },
      });

      return {
        ok: true as const,
        balance: decimalToNumber(updated.balance),
        total,
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
      };
    });

    if (!result.ok) {
      await logEvent({
        category: EventCategory.TRANSACTION,
        action: "CHECKOUT_FAILURE",
        status: EventStatus.FAILURE,
        message: `Insufficient balance for "${user.username}"`,
        userId: user.id,
        username: user.username,
        metadata: {
          total: result.total,
          balance: result.balance,
          itemCount: orderItems.length,
        },
        request,
      });

      return NextResponse.json(
        {
          error: `Insufficient balance. Your total is ${formatPrice(result.total)} but you only have ${formatPrice(result.balance)} available.`,
          balance: result.balance,
          total: result.total,
        },
        { status: 400 },
      );
    }

    await logEvent({
      category: EventCategory.TRANSACTION,
      action: "CHECKOUT_SUCCESS",
      status: EventStatus.SUCCESS,
      message: `Order completed for "${user.username}" — ${formatPrice(result.total)}`,
      userId: user.id,
      username: user.username,
      metadata: {
        total: result.total,
        balance: result.balance,
        orderId: result.orderId,
        invoiceNumber: result.invoiceNumber,
        items: orderItems,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully!",
      total: result.total,
      balance: result.balance,
      items: orderItems,
      orderId: result.orderId,
      invoiceNumber: result.invoiceNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logEvent({
      category: EventCategory.TRANSACTION,
      action: "CHECKOUT_FAILURE",
      status: EventStatus.FAILURE,
      message: "Checkout failed: server error",
      request,
    });

    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
