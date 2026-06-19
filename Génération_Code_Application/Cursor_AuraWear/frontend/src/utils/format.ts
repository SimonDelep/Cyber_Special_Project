export function formatCurrency(value: string | number) {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    Number.isNaN(amount) ? 0 : amount,
  );
}
