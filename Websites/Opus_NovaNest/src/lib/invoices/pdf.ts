import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatPrice } from '../format';
import type { InvoiceCustomer, OrderWithItems } from '../db/orders';

const MARGIN = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LINE_HEIGHT = 16;

export async function generateInvoicePdf(
  order: OrderWithItems,
  customer: InvoiceCustomer,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  const drawText = (
    text: string,
    x: number,
    size: number,
    font = regular,
    color = rgb(0.12, 0.16, 0.22),
  ) => {
    page.drawText(text, { x, y, size, font, color });
  };

  drawText('NovaNest', MARGIN, 22, bold, rgb(0.05, 0.55, 0.65));
  y -= 28;
  drawText('INVOICE', MARGIN, 18, bold);
  y -= LINE_HEIGHT * 1.5;

  drawText(`Invoice #: ${order.invoiceNumber}`, MARGIN, 11, bold);
  y -= LINE_HEIGHT;
  drawText(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    MARGIN,
    10,
  );
  y -= LINE_HEIGHT * 2;

  drawText('Bill to', MARGIN, 11, bold);
  y -= LINE_HEIGHT;
  drawText(customer.displayName, MARGIN, 10);
  y -= LINE_HEIGHT;
  drawText(customer.email, MARGIN, 10);
  y -= LINE_HEIGHT;
  drawText(`@${customer.username}`, MARGIN, 10, regular, rgb(0.4, 0.45, 0.5));
  y -= LINE_HEIGHT * 2;

  const colName = MARGIN;
  const colQty = 320;
  const colUnit = 380;
  const colTotal = 480;

  drawText('Item', colName, 10, bold);
  page.drawText('Qty', { x: colQty, y, size: 10, font: bold });
  page.drawText('Unit', { x: colUnit, y, size: 10, font: bold });
  page.drawText('Total', { x: colTotal, y, size: 10, font: bold });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.9),
  });
  y -= LINE_HEIGHT;

  for (const item of order.items) {
    if (y < MARGIN + 80) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    const name =
      item.productName.length > 42
        ? `${item.productName.slice(0, 39)}…`
        : item.productName;

    drawText(name, colName, 10);
    page.drawText(String(item.quantity), { x: colQty, y, size: 10, font: regular });
    page.drawText(formatPrice(item.unitPriceCents), {
      x: colUnit,
      y,
      size: 10,
      font: regular,
    });
    page.drawText(formatPrice(item.lineTotalCents), {
      x: colTotal,
      y,
      size: 10,
      font: regular,
    });
    y -= LINE_HEIGHT;
  }

  y -= LINE_HEIGHT;
  page.drawLine({
    start: { x: colUnit - 20, y: y + 8 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 8 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.9),
  });
  y -= LINE_HEIGHT;

  drawText('Total (CAD)', colUnit, 12, bold);
  page.drawText(formatPrice(order.totalCents), {
    x: colTotal,
    y,
    size: 12,
    font: bold,
    color: rgb(0.05, 0.55, 0.65),
  });
  y -= LINE_HEIGHT * 2;

  drawText(
    'Paid from NovaNest account balance (simulated checkout).',
    MARGIN,
    9,
    regular,
    rgb(0.45, 0.5, 0.55),
  );
  y -= LINE_HEIGHT;
  drawText('Thank you for your purchase!', MARGIN, 9, regular, rgb(0.45, 0.5, 0.55));

  return doc.save();
}
