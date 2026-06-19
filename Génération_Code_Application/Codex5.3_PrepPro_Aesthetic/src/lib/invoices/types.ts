export type OrderLine = {
  productId: number;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type OrderRecord = {
  id: number;
  invoiceNumber: string;
  userId: number;
  totalCents: number;
  lines: OrderLine[];
  customerDisplayName: string;
  customerEmail: string;
  customerUsername: string;
  createdAt: string;
};
