"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCart, clearCart } from "@/lib/cart";
import { requireUser } from "@/lib/auth";
import { z } from "zod";
import { logEvent } from "@/lib/event-log";

const checkoutSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional().or(z.literal("")),
  shippingAddress: z.string().min(5).max(500),
});

export async function simulateCheckoutAction(formData: FormData): Promise<void> {
  const { userId } = await requireUser();

  const cart = getCart();
  if (!cart.length) {
    await logEvent({
      type: "checkout.request_rejected",
      severity: "WARN",
      message: "Checkout rejected: cart empty",
      userId,
    });
    redirect("/cart");
  }

  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    shippingAddress: String(formData.get("shippingAddress") ?? ""),
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    await logEvent({
      type: "checkout.request_rejected",
      severity: "WARN",
      message: "Checkout rejected: validation error",
      userId,
    });
    redirect("/checkout?error=1");
  }

  const productIds = cart.map((c) => c.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true },
  });
  if (!products.length) {
    redirect("/cart");
  }

  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const itemsData: { productId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of cart) {
    const product = byId.get(item.productId);
    if (!product) continue;
    const unit = Number(product.price);
    const quantity = item.quantity;
    const lineTotal = unit * quantity;
    subtotal += lineTotal;
    itemsData.push({ productId: product.id, quantity, unitPrice: unit });
  }

  if (!itemsData.length) {
    await logEvent({
      type: "checkout.request_rejected",
      severity: "WARN",
      message: "Checkout rejected: no valid items",
      userId,
    });
    redirect("/cart");
  }

  const shippingCost = 0;
  const total = subtotal + shippingCost;

  const customer = await prisma.customer.upsert({
    where: { email: parsed.data.email },
    update: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
    },
    create: {
      email: parsed.data.email,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone || null,
    },
  });

  const randomSuffix = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  const orderNumber = `SIM-${Date.now()}-${randomSuffix}`;

  const totalStr = String(total.toFixed(2));

  let order: { id: string; orderNumber: string };
  try {
    await logEvent({
      type: "checkout.request",
      severity: "INFO",
      message: "Checkout request",
      userId,
      metadata: { items: itemsData.length, total: totalStr },
    });
    order = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, balance: { gte: totalStr } },
        data: { balance: { decrement: totalStr } },
      });

      if (updated.count !== 1) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      return tx.order.create({
        data: {
          orderNumber,
          status: "PENDING",
          subtotal: String(subtotal.toFixed(2)),
          shippingCost: String(shippingCost.toFixed(2)),
          total: totalStr,
          shippingAddress: parsed.data.shippingAddress,
          customerId: customer.id,
          items: {
            createMany: {
              data: itemsData.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: String(item.unitPrice.toFixed(2)),
              })),
            },
          },
        },
        select: { id: true, orderNumber: true },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_FUNDS") {
      await logEvent({
        type: "checkout.failed",
        severity: "WARN",
        message: "Checkout failed: insufficient funds",
        userId,
        metadata: { total: totalStr },
      });
      redirect("/checkout?error=INSUFFICIENT_FUNDS");
    }
    await logEvent({
      type: "checkout.failed",
      severity: "ERROR",
      message: "Checkout failed: system error",
      userId,
      metadata: { error: e instanceof Error ? e.message : String(e) },
    });
    throw e;
  }

  clearCart();
  await logEvent({
    type: "checkout.success",
    severity: "INFO",
    message: "Checkout success",
    userId,
    metadata: { orderNumber: order.orderNumber, total: totalStr, items: itemsData.length },
  });

  redirect(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`);
}

