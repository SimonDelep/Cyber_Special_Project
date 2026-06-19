import { AuditAction } from "@/lib/audit/actions";
import { logEvent, type LogEventInput } from "@/lib/audit/logger";
import { getSessionUser } from "@/lib/auth/session";
import { checkoutSchema, formatZodErrors } from "@/lib/checkout/validation";
import { jsonError, jsonOk } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { generateInvoiceNumber } from "@/lib/invoice/number";
import { prisma } from "@/lib/prisma";

async function logCheckoutFailure(
  request: Request,
  message: string,
  userId?: string,
  username?: string,
  metadata?: LogEventInput["metadata"],
) {
  await logEvent({
    category: "TRANSACTION",
    action: AuditAction.TRANSACTION_CHECKOUT,
    status: "FAILURE",
    message,
    userId,
    username,
    request,
    metadata,
  });
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      await logCheckoutFailure(request, "Checkout denied: not authenticated");
      return jsonError("Sign in to complete checkout", 401);
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      await logCheckoutFailure(
        request,
        "Checkout failed: invalid cart payload",
        sessionUser.id,
        sessionUser.username,
        { reason: "validation" },
      );
      return jsonError(formatZodErrors(parsed.error));
    }

    const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      await logCheckoutFailure(
        request,
        "Checkout failed: unavailable products",
        sessionUser.id,
        sessionUser.username,
        { reason: "missing_products" },
      );
      return jsonError("One or more products in your cart are no longer available", 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalCents = 0;
    const lineItems: {
      productId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }[] = [];

    for (const item of parsed.data.items) {
      const product = productMap.get(item.productId);
      if (!product) continue;

      if (!product.inStock) {
        await logCheckoutFailure(
          request,
          `Checkout failed: "${product.name}" out of stock`,
          sessionUser.id,
          sessionUser.username,
          { productId: product.id, reason: "out_of_stock" },
        );
        return jsonError(`"${product.name}" is out of stock`, 400);
      }

      const lineTotalCents = product.priceCents * item.quantity;
      totalCents += lineTotalCents;
      lineItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents,
      });
    }

    if (totalCents <= 0) {
      await logCheckoutFailure(
        request,
        "Checkout failed: zero total",
        sessionUser.id,
        sessionUser.username,
        { reason: "zero_total" },
      );
      return jsonError("Cart total must be greater than zero", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) return jsonError("User not found", 404);

    if (user.balanceCents < totalCents) {
      const shortfall = totalCents - user.balanceCents;
      await logCheckoutFailure(
        request,
        `Checkout failed: insufficient balance for "${user.username}"`,
        user.id,
        user.username,
        {
          reason: "insufficient_balance",
          totalCents,
          balanceCents: user.balanceCents,
          shortfallCents: shortfall,
        },
      );
      return jsonError(
        `Insufficient balance. Your total is ${formatPrice(totalCents)} but you only have ${formatPrice(user.balanceCents)}. You need ${formatPrice(shortfall)} more.`,
        402,
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { balanceCents: user.balanceCents - totalCents },
    });

    const order = await prisma.order.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        userId: user.id,
        totalCents,
        lineItems,
      },
    });

    await logEvent({
      category: "TRANSACTION",
      action: AuditAction.TRANSACTION_CHECKOUT,
      status: "SUCCESS",
      message: `Checkout completed for "${user.username}" — ${formatPrice(totalCents)}`,
      userId: user.id,
      username: user.username,
      request,
      metadata: {
        totalCents,
        previousBalanceCents: user.balanceCents,
        newBalanceCents: updated.balanceCents,
        itemCount: lineItems.length,
        lineItems,
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
      },
    });

    const { passwordHash: _, ...safeUser } = updated;

    return jsonOk({
      success: true,
      message: "Checkout complete! Your balance has been updated.",
      totalCents,
      lineItems,
      user: safeUser,
      order: {
        id: order.id,
        invoiceNumber: order.invoiceNumber,
      },
    });
  } catch (err) {
    console.error("[checkout POST]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    await logEvent({
      category: "TRANSACTION",
      action: AuditAction.TRANSACTION_CHECKOUT,
      status: "FAILURE",
      message: `Checkout error: ${message}`,
      request,
      metadata: { reason: "server_error" },
    });
    return jsonError(message, 500);
  }
}
