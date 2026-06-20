import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatBalance } from "@/lib/money";

export type InvoiceOrderData = {
  id: string;
  createdAt: Date;
  status: string;
  totalCents: number;
  customer: {
    name: string;
    email: string;
  };
  items: {
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLOR_PRIMARY = rgb(0.03, 0.58, 0.71);
const COLOR_TEXT = rgb(0.09, 0.09, 0.11);
const COLOR_MUTED = rgb(0.44, 0.44, 0.46);
const COLOR_BORDER = rgb(0.89, 0.89, 0.91);

function shortOrderId(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function invoiceFilename(orderId: string): string {
  return `invoice-${shortOrderId(orderId)}.pdf`;
}

function wrapText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

export async function buildInvoicePdf(order: InvoiceOrderData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const draw = (
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      x?: number;
    } = {}
  ) => {
    const size = opts.size ?? 10;
    const x = opts.x ?? MARGIN;
    page.drawText(text, {
      x,
      y,
      size,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? COLOR_TEXT,
    });
    y -= size + 6;
  };

  draw("E-Shop", { size: 22, bold: true, color: COLOR_PRIMARY });
  draw("Invoice", { size: 10, color: COLOR_MUTED });
  y -= 8;

  draw(`Invoice #: ${shortOrderId(order.id)}`);
  draw(`Order ID: ${order.id}`);
  draw(
    `Date: ${order.createdAt.toLocaleString("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
    })}`
  );
  draw(`Status: ${order.status}`);
  y -= 6;

  draw("Bill to", { size: 11, bold: true });
  draw(order.customer.name);
  draw(order.customer.email);
  y -= 8;

  const colName = MARGIN;
  const colQty = 320;
  const colUnit = 380;
  const colLine = 480;
  const headerY = y;

  page.drawText("Item", {
    x: colName,
    y: headerY,
    size: 9,
    font,
    color: COLOR_MUTED,
  });
  page.drawText("Qty", {
    x: colQty,
    y: headerY,
    size: 9,
    font,
    color: COLOR_MUTED,
  });
  page.drawText("Unit", {
    x: colUnit,
    y: headerY,
    size: 9,
    font,
    color: COLOR_MUTED,
  });
  page.drawText("Line", {
    x: colLine,
    y: headerY,
    size: 9,
    font,
    color: COLOR_MUTED,
  });

  y = headerY - 16;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: COLOR_BORDER,
  });
  y -= 18;

  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  for (const item of order.items) {
    const lineCents = item.unitPriceCents * item.quantity;
    const rowY = y;

    page.drawText(wrapText(item.productName, 42), {
      x: colName,
      y: rowY,
      size: 10,
      font,
      color: COLOR_TEXT,
      maxWidth: 250,
    });
    page.drawText(String(item.quantity), {
      x: colQty,
      y: rowY,
      size: 10,
      font,
      color: COLOR_TEXT,
    });
    page.drawText(formatBalance(item.unitPriceCents), {
      x: colUnit,
      y: rowY,
      size: 10,
      font,
      color: COLOR_TEXT,
    });
    page.drawText(formatBalance(lineCents), {
      x: colLine,
      y: rowY,
      size: 10,
      font,
      color: COLOR_TEXT,
    });

    y -= 22;
  }

  y -= 12;
  const totalsStart = y;

  page.drawText("Subtotal:", {
    x: 380,
    y: totalsStart,
    size: 10,
    font,
    color: COLOR_TEXT,
  });
  page.drawText(formatBalance(subtotalCents), {
    x: colLine,
    y: totalsStart,
    size: 10,
    font,
    color: COLOR_TEXT,
  });

  page.drawText("Tax:", {
    x: 380,
    y: totalsStart - 18,
    size: 10,
    font,
    color: COLOR_TEXT,
  });
  page.drawText(formatBalance(0), {
    x: colLine,
    y: totalsStart - 18,
    size: 10,
    font,
    color: COLOR_TEXT,
  });

  page.drawText("Total:", {
    x: 380,
    y: totalsStart - 40,
    size: 11,
    font: fontBold,
    color: COLOR_PRIMARY,
  });
  page.drawText(formatBalance(order.totalCents), {
    x: colLine,
    y: totalsStart - 40,
    size: 11,
    font: fontBold,
    color: COLOR_PRIMARY,
  });

  page.drawText("Paid with store credit. Thank you for your purchase.", {
    x: MARGIN,
    y: 60,
    size: 9,
    font,
    color: COLOR_MUTED,
    maxWidth: CONTENT_WIDTH,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
