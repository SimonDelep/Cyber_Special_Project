import type { CartLine } from "@/lib/cart/types";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart/constants";

export function parseCartJson(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CartLine =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as CartLine).productId === "string" &&
          typeof (item as CartLine).quantity === "number" &&
          (item as CartLine).quantity > 0,
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(Math.floor(item.quantity), MAX_QUANTITY_PER_ITEM),
      }));
  } catch {
    return [];
  }
}

export function addLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  const next = [...lines];
  const existing = next.find((l) => l.productId === productId);
  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + quantity,
      MAX_QUANTITY_PER_ITEM,
    );
  } else {
    next.push({
      productId,
      quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM),
    });
  }
  return next;
}

export function updateLine(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) {
    return lines.filter((l) => l.productId !== productId);
  }
  return lines.map((l) =>
    l.productId === productId
      ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) }
      : l,
  );
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.productId !== productId);
}
