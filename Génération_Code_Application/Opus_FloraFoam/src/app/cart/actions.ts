"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  computeCartTotalCents,
  getCartWithItems,
  getOrCreateCart,
} from "@/lib/cart";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/invoices/invoice-number";
import { logSystemEvent } from "@/lib/monitoring/logger";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validations/cart";
import { formatPrice } from "@/types/product";

export type CartActionState = {
  success?: boolean;
  error?: string;
  message?: string;
  orderId?: string;
  invoiceNumber?: string;
};

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function revalidateCartPaths() {
  revalidatePath("/cart");
  revalidatePath("/");
}

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { error: "Sign in to add items to your cart." };
  }

  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid item." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  if (!product.inStock) {
    return { error: "This product is out of stock." };
  }

  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: product.id,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(existing.quantity + parsed.data.quantity, 99) },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: parsed.data.quantity,
      },
    });
  }

  revalidateCartPaths();
  return { success: true, message: `${product.name} added to cart.` };
}

export async function updateCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { error: "Sign in to update your cart." };
  }

  const parsed = updateCartItemSchema.safeParse({
    cartItemId: formData.get("cartItemId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid quantity." };
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id: parsed.data.cartItemId,
      cart: { userId },
    },
  });

  if (!item) {
    return { error: "Cart item not found." };
  }

  if (parsed.data.quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.data.quantity },
    });
  }

  revalidateCartPaths();
  return { success: true };
}

export async function removeCartItemAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const userId = await requireUserId();
  if (!userId) {
    return { error: "Sign in to update your cart." };
  }

  const parsed = removeCartItemSchema.safeParse({
    cartItemId: formData.get("cartItemId"),
  });

  if (!parsed.success) {
    return { error: "Invalid cart item." };
  }

  await prisma.cartItem.deleteMany({
    where: {
      id: parsed.data.cartItemId,
      cart: { userId },
    },
  });

  revalidateCartPaths();
  return { success: true };
}

export async function checkoutAction(
  _prev: CartActionState,
  _formData?: FormData,
): Promise<CartActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in to complete checkout." };
  }

  const userId = session.user.id;
  const username = session.user.username;

  await logSystemEvent({
    type: "TRANSACTION_REQUEST",
    message: `Checkout initiated by "${username}".`,
    userId,
    username,
  });

  const cart = await getCartWithItems(userId);

  if (!cart?.items.length) {
    await logSystemEvent({
      type: "TRANSACTION_FAILURE",
      severity: "WARNING",
      message: `Checkout failed for "${username}": empty cart.`,
      userId,
      username,
      metadata: { reason: "empty_cart" },
    });
    return { error: "Your cart is empty. Add products before checkout." };
  }

  const outOfStock = cart.items.filter((item) => !item.product.inStock);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((i) => i.product.name).join(", ");
    await logSystemEvent({
      type: "TRANSACTION_FAILURE",
      severity: "WARNING",
      message: `Checkout failed for "${username}": out-of-stock items.`,
      userId,
      username,
      metadata: { reason: "out_of_stock", products: names },
    });
    return { error: `Remove out-of-stock items before checkout: ${names}.` };
  }

  const totalCents = computeCartTotalCents(cart.items);
  const itemSummary = cart.items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    quantity: i.quantity,
    lineCents: i.product.priceCents * i.quantity,
  }));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balanceCents: true, name: true, email: true },
  });

  if (!user) {
    await logSystemEvent({
      type: "TRANSACTION_FAILURE",
      severity: "ERROR",
      message: `Checkout failed for "${username}": account not found.`,
      userId,
      username,
      metadata: { reason: "account_not_found", totalCents },
    });
    return { error: "Account not found." };
  }

  if (user.balanceCents < totalCents) {
    const shortfall = totalCents - user.balanceCents;
    await logSystemEvent({
      type: "TRANSACTION_FAILURE",
      severity: "WARNING",
      message: `Checkout failed for "${username}": insufficient balance.`,
      userId,
      username,
      metadata: {
        reason: "insufficient_balance",
        totalCents,
        balanceCents: user.balanceCents,
        shortfallCents: shortfall,
      },
    });
    return {
      error: `Insufficient balance. You have ${formatPrice(user.balanceCents)} but your order total is ${formatPrice(totalCents)}. Add at least ${formatPrice(shortfall)} to your account to complete this purchase.`,
    };
  }

  const newBalanceCents = user.balanceCents - totalCents;
  const invoiceNumber = generateInvoiceNumber();

  const order = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { balanceCents: newBalanceCents },
    });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return tx.order.create({
      data: {
        invoiceNumber,
        userId,
        totalCents,
        balanceBeforeCents: user.balanceCents,
        balanceAfterCents: newBalanceCents,
        customerUsername: username,
        customerName: user.name,
        customerEmail: user.email,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            productSlug: item.product.slug,
            category: item.product.category,
            unitPriceCents: item.product.priceCents,
            quantity: item.quantity,
            lineTotalCents: item.product.priceCents * item.quantity,
          })),
        },
      },
    });
  });

  await logSystemEvent({
    type: "TRANSACTION_SUCCESS",
    message: `Checkout completed for "${username}": ${formatPrice(totalCents)} charged.`,
    userId,
    username,
    metadata: {
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      totalCents,
      previousBalanceCents: user.balanceCents,
      newBalanceCents,
      items: itemSummary,
    },
  });

  revalidateCartPaths();
  revalidatePath("/profile");

  return {
    success: true,
    orderId: order.id,
    invoiceNumber: order.invoiceNumber,
    message: `Checkout complete! ${formatPrice(totalCents)} was deducted from your account balance.`,
  };
}
