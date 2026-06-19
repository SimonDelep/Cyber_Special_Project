import type { CheckoutLineItem } from '@/lib/checkout';

export type OrderLineItem = CheckoutLineItem;

export type OrderRecord = {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  lineItems: OrderLineItem[];
  total: number;
  previousBalance: number;
  newBalance: number;
  createdAt: Date;
};
