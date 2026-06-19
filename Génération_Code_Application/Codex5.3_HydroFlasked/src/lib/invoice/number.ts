/** Human-readable invoice number, e.g. HF-20260604-A3F9K2 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HF-${y}${m}${d}-${suffix}`;
}
