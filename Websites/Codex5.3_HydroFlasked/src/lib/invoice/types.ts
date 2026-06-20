export type InvoiceLineItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type InvoiceCustomer = {
  username: string;
  displayName: string | null;
  email: string | null;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderId: string;
  issuedAt: Date;
  customer: InvoiceCustomer;
  lineItems: InvoiceLineItem[];
  totalCents: number;
};

export function parseLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is InvoiceLineItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as InvoiceLineItem).productId === "string" &&
      typeof (item as InvoiceLineItem).name === "string" &&
      typeof (item as InvoiceLineItem).quantity === "number" &&
      typeof (item as InvoiceLineItem).unitPriceCents === "number" &&
      typeof (item as InvoiceLineItem).lineTotalCents === "number",
  );
}
