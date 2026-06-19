import PDFDocument from 'pdfkit';
import type { OrderWithItems } from '@/db/schema';
import { formatCurrency } from '@/lib/format';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateInvoicePdf(order: OrderWithItems): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc
      .fontSize(28)
      .fillColor('#3d3027')
      .font('Helvetica-Bold')
      .text('LunaLuxe', { continued: true })
      .fillColor('#8b5cf6')
      .text('Luxe', { continued: false });

    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#7d6249').font('Helvetica').text('Restful Luxury for Every Night');
    doc.moveDown(1.5);

    doc.fontSize(20).fillColor('#3d3027').font('Helvetica-Bold').text('INVOICE');
    doc.moveDown(0.5);

    // Invoice meta
    doc.fontSize(10).font('Helvetica').fillColor('#4f3d30');
    const metaY = doc.y;
    doc.text(`Invoice number: ${order.orderNumber}`, 50, metaY);
    doc.text(`Date: ${formatDate(order.createdAt)}`);
    doc.text(`Payment: Account balance (simulated)`);
    doc.moveDown(1.5);

    // Bill to
    doc.font('Helvetica-Bold').text('Bill to:');
    doc.font('Helvetica');
    doc.text(order.customerName);
    doc.text(order.customerEmail);
    doc.moveDown(1.5);

    // Table header
    const tableTop = doc.y;
    const colName = 50;
    const colQty = 320;
    const colPrice = 380;
    const colTotal = 460;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.rect(50, tableTop, pageWidth, 22).fill('#3d3027');
    doc.fillColor('#ffffff');
    doc.text('Product', colName + 8, tableTop + 6, { width: 250 });
    doc.text('Qty', colQty, tableTop + 6, { width: 50, align: 'center' });
    doc.text('Unit price', colPrice, tableTop + 6, { width: 70, align: 'right' });
    doc.text('Total', colTotal, tableTop + 6, { width: 70, align: 'right' });

    let rowY = tableTop + 22;
    doc.font('Helvetica').fontSize(9).fillColor('#3d3027');

    for (const item of order.items) {
      if (rowY > doc.page.height - 120) {
        doc.addPage();
        rowY = 50;
      }

      const rowHeight = 28;
      doc.rect(50, rowY, pageWidth, rowHeight).fillAndStroke('#faf8f5', '#e6d9c8');
      doc.fillColor('#3d3027');
      doc.text(item.productName, colName + 8, rowY + 8, { width: 250 });
      doc.text(String(item.quantity), colQty, rowY + 8, { width: 50, align: 'center' });
      doc.text(formatCurrency(item.unitPrice), colPrice, rowY + 8, { width: 70, align: 'right' });
      doc.text(formatCurrency(item.lineTotal), colTotal, rowY + 8, { width: 70, align: 'right' });
      rowY += rowHeight;
    }

    // Totals
    rowY += 16;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Order total:', colPrice - 30, rowY, { width: 100, align: 'right' });
    doc.text(formatCurrency(order.total), colTotal, rowY, { width: 70, align: 'right' });

    rowY += 20;
    doc.font('Helvetica').fontSize(9).fillColor('#7d6249');
    doc.text(`Balance after purchase: ${formatCurrency(order.balanceAfter)}`, 50, rowY);

    // Footer
    doc
      .fontSize(8)
      .fillColor('#9a7b5f')
      .text(
        'Thank you for shopping with LunaLuxe. This is a simulated invoice for educational purposes.',
        50,
        doc.page.height - 60,
        { align: 'center', width: pageWidth }
      );

    doc.end();
  });
}
