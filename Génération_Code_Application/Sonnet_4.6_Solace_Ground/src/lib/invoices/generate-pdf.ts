import PDFDocument from 'pdfkit';
import type { OrderWithDetails } from '@/lib/orders/queries';
import { formatPrice } from '@/lib/utils';

function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateInvoicePdf(order: OrderWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const customerName = order.displayName?.trim() || order.username;

    doc
      .fontSize(22)
      .fillColor('#3d2f24')
      .text('Solace Ground', { align: 'left' });
    doc
      .fontSize(10)
      .fillColor('#6b5a4a')
      .text('Premium cork yoga mats & meditation cushions', { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(16).fillColor('#3d2f24').text('INVOICE', { align: 'right' });
    doc
      .fontSize(10)
      .fillColor('#3d2f24')
      .text(`Invoice #: ${order.invoiceNumber}`, { align: 'right' })
      .text(`Date: ${formatInvoiceDate(order.createdAt)}`, { align: 'right' })
      .text(`Order ID: ${order.id}`, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(11).fillColor('#3d2f24').text('Bill to', { underline: true });
    doc
      .fontSize(10)
      .fillColor('#3d2f24')
      .text(customerName)
      .text(order.email)
      .text(`Account: ${order.username}`);

    doc.moveDown(1.5);
    const tableTop = doc.y;
    const colName = 50;
    const colQty = 320;
    const colUnit = 380;
    const colTotal = 470;

    doc.fontSize(9).fillColor('#ffffff');
    doc.rect(colName, tableTop, 495 - colName, 18).fill('#5c4a3a');
    doc.fillColor('#ffffff');
    doc.text('Item', colName + 6, tableTop + 5, { width: 250 });
    doc.text('Qty', colQty, tableTop + 5, { width: 50, align: 'right' });
    doc.text('Unit', colUnit, tableTop + 5, { width: 80, align: 'right' });
    doc.text('Total', colTotal, tableTop + 5, { width: 70, align: 'right' });

    let y = tableTop + 22;
    doc.fillColor('#3d2f24').fontSize(9);

    for (const item of order.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.productName, colName, y, { width: 255 });
      doc.text(String(item.quantity), colQty, y, { width: 50, align: 'right' });
      doc.text(formatPrice(item.unitPriceCents), colUnit, y, {
        width: 80,
        align: 'right',
      });
      doc.text(formatPrice(item.lineTotalCents), colTotal, y, {
        width: 70,
        align: 'right',
      });
      y += 20;
    }

    doc.moveDown(2);
    const totalY = Math.max(y + 10, doc.y);
    doc
      .fontSize(11)
      .fillColor('#3d2f24')
      .text(`Total paid: ${formatPrice(order.totalCents)}`, colUnit, totalY, {
        width: 160,
        align: 'right',
      });

    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor('#6b5a4a')
      .text('Payment method: Account balance (simulated checkout)', {
        align: 'left',
      });
    doc.text('This document is generated automatically after purchase.', {
      align: 'left',
    });
    doc.text('Thank you for shopping with Solace Ground.', { align: 'left' });

    doc.end();
  });
}
