export type InvoiceLineItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderId: string;
  issuedAt: Date;
  customer: {
    name: string;
    username: string;
    email: string | null;
  };
  lineItems: InvoiceLineItem[];
  totalCents: number;
  paymentMethod: string;
};
