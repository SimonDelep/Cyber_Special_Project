import type { APIRoute } from "astro";
import { createOrder } from "@/db/orders";
import { findProductById } from "@/db/products";
import { findUserById, updateUser } from "@/db/users";
import { toPublicUser } from "@/lib/auth/session";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { logEventFromRequest } from "@/lib/monitoring/logger";

type CheckoutLine = {
  productId: number;
  quantity: number;
};

export const POST: APIRoute = async ({ locals, request }) => {
  if (!locals.user) {
    return errorResponse("Sign in to complete checkout.", 401);
  }

  try {
    const body = await request.json();
    const lines = body.items as CheckoutLine[] | undefined;

    if (!Array.isArray(lines) || lines.length === 0) {
      return errorResponse("Your cart is empty.", 400);
    }

    let totalCents = 0;
    const orderLines: {
      productId: number;
      name: string;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
    }[] = [];

    for (const line of lines) {
      const productId = Number(line.productId);
      const quantity = Number(line.quantity);

      if (!Number.isInteger(productId) || productId < 1) {
        return errorResponse("Invalid product in cart.", 400);
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return errorResponse("Invalid quantity in cart.", 400);
      }

      const product = findProductById(productId);
      if (!product) {
        return errorResponse(`Product #${productId} is no longer available.`, 400);
      }

      const lineTotal = product.priceCents * quantity;
      totalCents += lineTotal;
      orderLines.push({
        productId: product.id,
        name: product.name,
        quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents: lineTotal,
      });
    }

    const user = findUserById(locals.user.id);
    if (!user) {
      return errorResponse("User account not found.", 404);
    }

    if (user.balanceCents < totalCents) {
      const shortfall = totalCents - user.balanceCents;
      logEventFromRequest(request, {
        eventType: "transaction.checkout.failure",
        status: "failure",
        userId: locals.user.id,
        actorLabel: locals.user.username,
        message: `Checkout declined for ${locals.user.username}: insufficient balance.`,
        metadata: {
          totalCents,
          balanceCents: user.balanceCents,
          shortfallCents: shortfall,
          lineCount: orderLines.length,
        },
      });
      return errorResponse(
        `Insufficient account balance. Your balance is ${(user.balanceCents / 100).toFixed(2)} CAD but the order total is ${(totalCents / 100).toFixed(2)} CAD. You need ${(shortfall / 100).toFixed(2)} CAD more.`,
        402,
      );
    }

    const newBalance = user.balanceCents - totalCents;
    const updated = updateUser(user.id, { balanceCents: newBalance });
    if (!updated) {
      return errorResponse("Could not update account balance.", 500);
    }

    const orderRecord = createOrder({
      userId: user.id,
      totalCents,
      lines: orderLines,
      customerDisplayName: user.displayName,
      customerEmail: user.email,
      customerUsername: user.username,
    });

    logEventFromRequest(request, {
      eventType: "transaction.checkout.success",
      status: "success",
      userId: locals.user.id,
      actorLabel: locals.user.username,
      message: `Checkout completed for ${locals.user.username}: ${(totalCents / 100).toFixed(2)} CAD.`,
      metadata: {
        orderId: orderRecord.id,
        invoiceNumber: orderRecord.invoiceNumber,
        totalCents,
        previousBalanceCents: user.balanceCents,
        newBalanceCents: newBalance,
        lineCount: orderLines.length,
        productIds: orderLines.map((l) => l.productId),
      },
    });

    return jsonResponse({
      ok: true,
      message: "Checkout complete. Thank you for your order!",
      order: {
        id: orderRecord.id,
        invoiceNumber: orderRecord.invoiceNumber,
        totalCents,
        lines: orderLines,
        createdAt: orderRecord.createdAt,
        invoiceUrl: `/api/invoices/${orderRecord.id}`,
      },
      user: toPublicUser(updated),
      balanceCents: updated.balanceCents,
    });
  } catch {
    return errorResponse("Checkout failed. Please try again.", 500);
  }
};
