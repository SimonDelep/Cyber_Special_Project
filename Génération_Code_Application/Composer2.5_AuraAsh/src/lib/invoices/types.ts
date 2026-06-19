export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderId: string;
  createdAt: Date;
  customer: {
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  items: InvoiceItem[];
  total: number;
  balanceAfter: number;
};
