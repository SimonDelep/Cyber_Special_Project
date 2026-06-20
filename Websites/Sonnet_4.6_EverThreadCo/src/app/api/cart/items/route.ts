import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { getCartForUser } from "@/lib/cart/server";
import { prisma } from "@/lib/prisma";
import { addToCartSchema } from "@/lib/validations/cart";

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = addToCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.inStock) {
      return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: auth.userId,
        productId,
        quantity,
      },
    });

    const cart = await getCartForUser(auth.userId);

    return NextResponse.json({ message: "Added to cart", cart });
  } catch {
    return NextResponse.json({ error: "Unable to add to cart" }, { status: 500 });
  }
}
