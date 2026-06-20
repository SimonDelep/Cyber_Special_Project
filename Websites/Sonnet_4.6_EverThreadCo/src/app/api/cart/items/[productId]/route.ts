import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { getCartForUser } from "@/lib/cart/server";
import { prisma } from "@/lib/prisma";
import { updateCartItemSchema } from "@/lib/validations/cart";

type RouteParams = { params: Promise<{ productId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { productId } = await params;

  try {
    const body = await request.json();
    const parsed = updateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId: auth.userId, productId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: parsed.data.quantity },
    });

    const cart = await getCartForUser(auth.userId);

    return NextResponse.json({ message: "Cart updated", cart });
  } catch {
    return NextResponse.json({ error: "Unable to update cart" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { productId } = await params;

  try {
    await prisma.cartItem.deleteMany({
      where: { userId: auth.userId, productId },
    });

    const cart = await getCartForUser(auth.userId);

    return NextResponse.json({ message: "Item removed", cart });
  } catch {
    return NextResponse.json({ error: "Unable to remove item" }, { status: 500 });
  }
}
