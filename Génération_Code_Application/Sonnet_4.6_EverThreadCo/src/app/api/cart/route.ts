import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { getCartForUser, getUserBalanceCents } from "@/lib/cart/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const [cart, balanceCents] = await Promise.all([
    getCartForUser(auth.userId),
    getUserBalanceCents(auth.userId),
  ]);

  return NextResponse.json({ cart, balanceCents });
}

export async function DELETE() {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  await prisma.cartItem.deleteMany({ where: { userId: auth.userId } });

  return NextResponse.json({ message: "Cart cleared" });
}
