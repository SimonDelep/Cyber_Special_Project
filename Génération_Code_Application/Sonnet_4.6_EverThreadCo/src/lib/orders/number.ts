/** Human-readable invoice / order reference (e.g. ET-20260603-A1B2C3). */
export function generateOrderNumber(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ET-${ymd}-${suffix}`;
}
