import PDFDocument from 'pdfkit';
import type { OrderRecord } from '@/lib/orders/types';

const BRAND = 'VoltStream';
const COMPANY_LINE = 'Quiet wellness technology · Simulated commerce';

function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildInvoicePdf(order: OrderRecord): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fillColor('#1e293b')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(BRAND, { align: 'left' });
    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text(COMPANY_LINE);

    doc.moveDown(0.5);
    doc
      .fillColor('#7c3aed')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('INVOICE', { align: 'right' });

    const metaY = doc.y - 28;
    doc
      .fillColor('#334155')
      .fontSize(9)
      .font('Helvetica')
      .text(`Invoice #: ${order.invoiceNumber}`, 50, metaY, { width: pageWidth, align: 'right' })
      .text(`Order ID: ${order.id}`, { width: pageWidth, align: 'right' })
      .text(`Date: ${formatDate(order.createdAt)}`, { width: pageWidth, align: 'right' });

    doc.moveDown(2);

    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Bill to');
    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(10)
      .text(order.customerName)
      .text(order.customerEmail);

    doc.moveDown(1.5);

    const tableTop = doc.y;
    const colProduct = 50;
    const colQty = 320;
    const colPrice = 380;
    const colSubtotal = 460;

    doc
      .rect(colProduct, tableTop, pageWidth, 22)
      .fill('#7c3aed');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('Product', colProduct + 8, tableTop + 6, { width: 250 });
    doc.text('Qty', colQty, tableTop + 6, { width: 50, align: 'right' });
    doc.text('Unit', colPrice, tableTop + 6, { width: 70, align: 'right' });
    doc.text('Subtotal', colSubtotal, tableTop + 6, { width: 80, align: 'right' });

    let rowY = tableTop + 22;
    doc.font('Helvetica').fontSize(9);

    for (const item of order.lineItems) {
      const rowHeight = 28;
      const isEven = order.lineItems.indexOf(item) % 2 === 0;
      if (isEven) {
        doc.rect(colProduct, rowY, pageWidth, rowHeight).fill('#f8fafc');
      }
      doc.fillColor('#1e293b');
      doc.text(item.name, colProduct + 8, rowY + 8, { width: 250 });
      doc.text(String(item.quantity), colQty, rowY + 8, { width: 50, align: 'right' });
      doc.text(formatMoney(item.price), colPrice, rowY + 8, { width: 70, align: 'right' });
      doc.text(formatMoney(item.subtotal), colSubtotal, rowY + 8, { width: 80, align: 'right' });
      rowY += rowHeight;
    }

    doc.y = rowY + 16;

    const summaryX = 340;
    doc.fillColor('#64748b').fontSize(10).font('Helvetica');
    doc.text('Subtotal:', summaryX, doc.y, { width: 100, align: 'right', continued: true });
    doc.fillColor('#0f172a').text(formatMoney(order.total), { align: 'right' });

    doc.moveDown(0.4);
    doc.fillColor('#64748b').text('Payment method:', summaryX, doc.y, { continued: true });
    doc.fillColor('#0f172a').text('Account balance (simulated)', { align: 'right' });

    doc.moveDown(0.4);
    doc.fillColor('#64748b').text('Balance before:', summaryX, doc.y, { continued: true });
    doc.fillColor('#0f172a').text(formatMoney(order.previousBalance), { align: 'right' });

    doc.moveDown(0.4);
    doc.fillColor('#64748b').text('Balance after:', summaryX, doc.y, { continued: true });
    doc.fillColor('#0f172a').text(formatMoney(order.newBalance), { align: 'right' });

    doc.moveDown(0.8);
    doc
      .fillColor('#7c3aed')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total paid:', summaryX, doc.y, { width: 100, align: 'right', continued: true });
    doc.text(formatMoney(order.total), { align: 'right' });

    doc.moveDown(2);
    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .font('Helvetica')
      .text(
        'This document is generated automatically after a simulated checkout. No physical goods are shipped. For support, contact support@voltstream.example.',
        { align: 'center', width: pageWidth },
      );

    doc.end();
  });
}

export function invoicePdfFilename(invoiceNumber: string): string {
  return `VoltStream-Invoice-${invoiceNumber}.pdf`;
}
