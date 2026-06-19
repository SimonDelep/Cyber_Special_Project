import type { Decimal } from "@prisma/client/runtime/library";

export function formatPrice(price: Decimal | number): string {
  const value = typeof price === "number" ? price : Number(price);
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

export function formatBalance(balance: Decimal | number): string {
  return formatPrice(balance);
}
