import { NextResponse } from "next/server";

import { requireAuthApi } from "@/lib/auth/api-auth";
import { CheckoutError, processCheckout } from "@/lib/checkout";
import { LogAction } from "@/lib/monitoring/actions";
import { logEvent } from "@/lib/monitoring/system-log";
import { checkoutSchema } from "@/lib/validations/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireAuthApi();
  if ("error" in authResult) return authResult.error;

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      await logEvent({
        category: "TRANSACTION",
        action: LogAction.CHECKOUT_FAILURE,
        message: "Checkout failed: invalid cart payload",
        userId: authResult.user.id,
        username: authResult.user.username,
        request,
        success: false,
      });
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const itemCount = parsed.data.items.reduce((n, i) => n + i.quantity, 0);

    await logEvent({
      category: "TRANSACTION",
      action: LogAction.CHECKOUT_REQUEST,
      message: `Checkout requested by "${authResult.user.username}" (${itemCount} items)`,
      userId: authResult.user.id,
      username: authResult.user.username,
      request,
      metadata: {
        lineCount: parsed.data.items.length,
        itemCount,
      },
      success: true,
    });

    const result = await processCheckout(authResult.user.id, parsed.data);

    await logEvent({
      category: "TRANSACTION",
      action: LogAction.CHECKOUT_SUCCESS,
      message: `Checkout completed for "${authResult.user.username}"`,
      userId: authResult.user.id,
      username: authResult.user.username,
      request,
      metadata: {
        orderId: result.order.id,
        totalCents: result.totalCents,
        balanceCents: result.balanceCents,
      },
      success: true,
    });

    return NextResponse.json({
      orderId: result.order.id,
      totalCents: result.totalCents,
      balanceCents: result.balanceCents,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      await logEvent({
        category: "TRANSACTION",
        action: LogAction.CHECKOUT_FAILURE,
        message: error.message,
        userId: authResult.user.id,
        username: authResult.user.username,
        request,
        metadata: {
          code: error.code,
          ...error.details,
        },
        success: false,
        level: error.code === "INSUFFICIENT_FUNDS" ? "WARN" : "ERROR",
      });

      if (error.code === "INSUFFICIENT_FUNDS" && error.details) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            balanceCents: error.details.balanceCents,
            totalCents: error.details.totalCents,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    await logEvent({
      category: "TRANSACTION",
      action: LogAction.CHECKOUT_FAILURE,
      message: "Checkout failed: internal error",
      userId: authResult.user.id,
      username: authResult.user.username,
      request,
      level: "ERROR",
      success: false,
    });

    console.error("[checkout]", error);

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Unable to complete checkout";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
