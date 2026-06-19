import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { resolveAuthUser } from "@/lib/auth";
import { parseCheckoutPayload, processCheckout } from "@/lib/checkout";
import { formatPrice } from "@/lib/products";
import { pathWithMessage, readFormString } from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const user = resolveAuthUser(locals, cookies);
  if (!user) {
    return redirect(
      pathWithMessage(
        "/login?redirect=%2Fcart",
        "error",
        "Sign in to complete checkout.",
      ),
    );
  }

  const formData = await request.formData();
  const linesJson = await readFormString(formData, "lines");
  const lines = parseCheckoutPayload(linesJson);

  if (!lines) {
    logSystemEvent({
      eventType: AuditEvent.TRANSACTION_CHECKOUT_FAILURE,
      category: "transaction",
      outcome: "failure",
      message: `Checkout rejected for @${user.username}: invalid cart payload.`,
      actorUserId: user.id,
      actorUsername: user.username,
      request,
    });
    return redirect(
      pathWithMessage("/cart", "error", "Invalid cart data. Please try again."),
    );
  }

  const lineCount = lines.reduce((sum, l) => sum + l.qty, 0);
  logSystemEvent({
    eventType: AuditEvent.TRANSACTION_CHECKOUT_REQUEST,
    category: "transaction",
    outcome: "info",
    message: `Checkout requested by @${user.username} (${lines.length} line(s), ${lineCount} item(s)).`,
    actorUserId: user.id,
    actorUsername: user.username,
    metadata: {
      lineCount: lines.length,
      itemCount: lineCount,
      productIds: lines.map((l) => l.productId),
    },
    request,
  });

  const result = processCheckout(user.id, lines);
  if (!result.ok) {
    logSystemEvent({
      eventType: AuditEvent.TRANSACTION_CHECKOUT_FAILURE,
      category: "transaction",
      outcome: "failure",
      message: `Checkout failed for @${user.username}: ${result.error}`,
      actorUserId: user.id,
      actorUsername: user.username,
      metadata: { reason: result.error },
      request,
    });
    return redirect(pathWithMessage("/cart", "error", result.error));
  }

  const summary = result.orderSummary
    .map((line) => `${line.qty}× ${line.name}`)
    .join(", ");

  logSystemEvent({
    eventType: AuditEvent.TRANSACTION_CHECKOUT_SUCCESS,
    category: "transaction",
    outcome: "success",
    message: `Checkout completed for @${user.username}: ${formatPrice(result.totalCents)} charged.`,
    actorUserId: user.id,
    actorUsername: user.username,
    metadata: {
      orderId: result.orderId,
      invoiceNumber: result.invoiceNumber,
      totalCents: result.totalCents,
      newBalanceCents: result.newBalanceCents,
      items: result.orderSummary,
    },
    request,
  });

  const successMsg = `Order complete! Invoice ${result.invoiceNumber}. Charged ${formatPrice(result.totalCents)}. New balance: ${formatPrice(result.newBalanceCents)}.`;
  const cartUrl = new URL("/cart", "http://internal");
  cartUrl.searchParams.set("success", successMsg);
  cartUrl.searchParams.set("orderId", String(result.orderId));
  cartUrl.searchParams.set("invoice", result.invoiceNumber);

  return redirect(cartUrl.pathname + cartUrl.search);
};
