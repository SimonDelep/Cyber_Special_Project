import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ProductCategory } from "@prisma/client";
import { CATEGORY_LABELS, formatPrice } from "@/types/product";

export type InvoiceLineItem = {
  productName: string;
  category: ProductCategory;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderDate: Date;
  customerUsername: string;
  customerName: string | null;
  customerEmail: string | null;
  items: InvoiceLineItem[];
  totalCents: number;
  balanceBeforeCents: number;
  balanceAfterCents: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

const colors = {
  brand: rgb(0.176, 0.29, 0.243),
  heading: rgb(0.1, 0.1, 0.1),
  body: rgb(0.2, 0.2, 0.2),
  muted: rgb(0.333, 0.333, 0.333),
  faint: rgb(0.533, 0.533, 0.533),
  line: rgb(0.8, 0.8, 0.8),
};

function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function drawText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  options: {
    font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
    size: number;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  },
) {
  page.drawText(text, {
    x,
    y,
    size: options.size,
    font: options.font,
    color: options.color ?? colors.body,
    maxWidth: options.maxWidth,
  });
}

export async function buildInvoicePdfBuffer(data: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let y = PAGE_HEIGHT - MARGIN;

  drawText(page, "FloraFoam", MARGIN, y, { font: fontBold, size: 22, color: colors.brand });
  y -= 28;
  drawText(page, "Plant-based skincare · Chicoutimi, QC", MARGIN, y, {
    font,
    size: 10,
    color: colors.muted,
  });
  y -= 32;
  drawText(page, "INVOICE", MARGIN, y, { font: fontBold, size: 16, color: colors.heading });
  y -= 22;
  drawText(page, `Invoice #: ${data.invoiceNumber}`, MARGIN, y, { font, size: 10 });
  y -= 14;
  drawText(page, `Date: ${formatInvoiceDate(data.orderDate)}`, MARGIN, y, { font, size: 10 });
  y -= 14;
  drawText(page, "Payment: Account balance (simulated)", MARGIN, y, { font, size: 10 });
  y -= 28;

  drawText(page, "Bill to", MARGIN, y, { font: fontBold, size: 11, color: colors.heading });
  y -= 16;

  const customerLines = [
    data.customerName ?? data.customerUsername,
    `@${data.customerUsername}`,
    data.customerEmail ?? undefined,
  ].filter(Boolean) as string[];

  for (const line of customerLines) {
    drawText(page, line, MARGIN, y, { font, size: 10 });
    y -= 14;
  }

  y -= 16;
  const colQty = MARGIN + contentWidth * 0.55;
  const colUnit = MARGIN + contentWidth * 0.68;
  const colTotal = MARGIN + contentWidth * 0.82;

  drawText(page, "Product", MARGIN, y, { font: fontBold, size: 9, color: colors.brand });
  drawText(page, "Qty", colQty, y, { font: fontBold, size: 9, color: colors.brand });
  drawText(page, "Unit", colUnit, y, { font: fontBold, size: 9, color: colors.brand });
  drawText(page, "Total", colTotal, y, { font: fontBold, size: 9, color: colors.brand });
  y -= 8;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + contentWidth, y },
    thickness: 1,
    color: colors.line,
  });
  y -= 18;

  for (const item of data.items) {
    drawText(page, item.productName, MARGIN, y, {
      font: fontBold,
      size: 9,
      maxWidth: contentWidth * 0.5,
    });
    drawText(page, String(item.quantity), colQty, y, { font, size: 9 });
    drawText(page, formatPrice(item.unitPriceCents), colUnit, y, { font, size: 9 });
    drawText(page, formatPrice(item.lineTotalCents), colTotal, y, { font, size: 9 });
    y -= 12;
    drawText(page, CATEGORY_LABELS[item.category], MARGIN, y, {
      font,
      size: 8,
      color: colors.faint,
      maxWidth: contentWidth * 0.5,
    });
    y -= 24;
  }

  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: MARGIN + contentWidth, y: y + 8 },
    thickness: 1,
    color: colors.line,
  });
  y -= 8;

  drawText(page, "Order total", colUnit - 20, y, { font: fontBold, size: 11, color: colors.heading });
  drawText(page, formatPrice(data.totalCents), colTotal, y, {
    font: fontBold,
    size: 11,
    color: colors.heading,
  });
  y -= 28;

  drawText(page, `Balance before purchase: ${formatPrice(data.balanceBeforeCents)}`, MARGIN, y, {
    font,
    size: 10,
    color: colors.muted,
  });
  y -= 14;
  drawText(page, `Balance after purchase: ${formatPrice(data.balanceAfterCents)}`, MARGIN, y, {
    font,
    size: 10,
    color: colors.muted,
  });
  y -= 28;

  drawText(
    page,
    "This invoice confirms a simulated purchase on FloraFoam. No card payment was processed.",
    MARGIN,
    y,
    { font, size: 9, color: colors.faint, maxWidth: contentWidth },
  );
  y -= 24;
  drawText(page, "Thank you for choosing FloraFoam.", MARGIN, y, {
    font,
    size: 9,
    color: colors.faint,
    maxWidth: contentWidth,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
