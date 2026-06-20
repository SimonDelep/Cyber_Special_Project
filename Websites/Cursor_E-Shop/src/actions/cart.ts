"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditAction, logAuditEventWithRequest } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/cart");
  }
  return session.user.id;
}

export async function addToCartAction(
  productId: string,
  _formData?: FormData
): Promise<void> {
  const userId = await requireUserId();
  const session = await auth();

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new Error("Product not found.");
  }

  if (product.stock != null && product.stock < 1) {
    redirect("/shop?error=out-of-stock");
  }

  await prisma.cartItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: {
      userId,
      productId,
      quantity: 1,
    },
    update: {
      quantity: {
        increment: 1,
      },
    },
  });

  const updated = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (
    updated &&
    product.stock != null &&
    updated.quantity > product.stock
  ) {
    await prisma.cartItem.update({
      where: { id: updated.id },
      data: { quantity: product.stock },
    });
  }

  await logAuditEventWithRequest({
    action: AuditAction.CART_ADD,
    userId,
    userEmail: session?.user?.email,
    resourceType: "product",
    resourceId: productId,
    details: { productName: product.name, slug: product.slug },
  });

  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/shop");

  redirect("/cart?added=1");
}

export async function setCartQuantityAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const cartItemId = String(formData.get("cartItemId") ?? "");
  const quantity = Number(formData.get("quantity"));

  if (!cartItemId) {
    redirect("/cart?error=invalid");
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    redirect("/cart?error=quantity");
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { product: true },
  });
  if (!item) {
    redirect("/cart?error=not-found");
  }

  if (item.product.stock != null && quantity > item.product.stock) {
    redirect(`/cart?error=stock&max=${item.product.stock}`);
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  redirect("/cart");
}

export async function removeFromCartAction(cartItemId: string): Promise<void> {
  const userId = await requireUserId();
  const session = await auth();

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { product: { select: { id: true, name: true, slug: true } } },
  });

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId },
  });

  if (item) {
    await logAuditEventWithRequest({
      action: AuditAction.CART_REMOVE,
      userId,
      userEmail: session?.user?.email,
      resourceType: "cartItem",
      resourceId: cartItemId,
      details: item.product
        ? {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
          }
        : { quantity: item.quantity },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
}
