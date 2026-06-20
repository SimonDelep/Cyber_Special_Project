import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/api";
import { CART_COOKIE } from "@/lib/cart/constants";
import { parseCartJson, updateLine, removeLine } from "@/lib/cart/store";
import { jsonWithCart } from "@/lib/cart/response";
import { resolveCartFromLines } from "@/lib/cart/server";
import { z } from "zod";

type RouteParams = { params: Promise<{ productId: string }> };

const updateSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(99),
});

async function readCartLines() {
  const cookieStore = await cookies();
  return parseCartJson(cookieStore.get(CART_COOKIE)?.value);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  const { productId } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const newLines = updateLine(
      await readCartLines(),
      productId,
      parsed.data.quantity,
    );
    const cart = await resolveCartFromLines(newLines);

    return jsonWithCart({ cart }, newLines);
  } catch (error) {
    console.error("[cart PATCH]", error);
    return jsonError("Failed to update cart", 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  const { productId } = await params;
  const newLines = removeLine(await readCartLines(), productId);
  const cart = await resolveCartFromLines(newLines);

  return jsonWithCart({ cart }, newLines);
}
