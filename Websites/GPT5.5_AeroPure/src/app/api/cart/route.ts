import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/api";
import { CART_COOKIE } from "@/lib/cart/constants";
import { parseCartJson, addLine } from "@/lib/cart/store";
import { jsonWithCart } from "@/lib/cart/response";
import { resolveCart, resolveCartFromLines } from "@/lib/cart/server";
import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { z } from "zod";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).optional().default(1),
});

async function readCartLines() {
  const cookieStore = await cookies();
  return parseCartJson(cookieStore.get(CART_COOKIE)?.value);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view your cart", 401);

  const cart = await resolveCart();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { balance: true },
  });

  return jsonWithCart(
    {
      cart,
      balance: dbUser ? Number(dbUser.balance) : 0,
    },
    await readCartLines(),
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to add items to your cart", 401);

  try {
    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
    });

    if (!product) return jsonError("Product not found", 404);
    if (!product.inStock) return jsonError("Product is out of stock", 400);

    const newLines = addLine(
      await readCartLines(),
      parsed.data.productId,
      parsed.data.quantity,
    );
    const cart = await resolveCartFromLines(newLines);

    await logEvent({
      level: LogLevel.INFO,
      category: LogCategory.CART,
      action: LOG_ACTIONS.CART_ADD,
      message: `Added "${product.name}" to cart (${parsed.data.quantity}x)`,
      userId: user.id,
      username: user.username,
      metadata: {
        productId: product.id,
        productName: product.name,
        quantity: parsed.data.quantity,
      },
      request,
    });

    return jsonWithCart({ cart, message: "Added to cart" }, newLines);
  } catch (error) {
    console.error("[cart POST]", error);
    return jsonError("Failed to add to cart", 500);
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  return jsonWithCart(
    { cart: { items: [], subtotal: 0, itemCount: 0 } },
    [],
  );
}
