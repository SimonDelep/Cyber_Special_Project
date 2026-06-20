import PDFDocument from "pdfkit";
import type { InvoiceOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

const STORE_NAME = "ByteMarket";
const STORE_ADDRESS = "Chicoutimi, QC, Canada";
const STORE_EMAIL = "billing@bytemarket.local";

function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function customerName(order: InvoiceOrder): string {
  return order.displayName?.trim() || order.username;
}

export function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fontSize(22)
      .fillColor("#0891b2")
      .text(STORE_NAME, { continued: false });
    doc
      .fontSize(10)
      .fillColor("#334155")
      .text(STORE_ADDRESS)
      .text(STORE_EMAIL)
      .moveDown(1.5);

    doc
      .fontSize(18)
      .fillColor("#0f172a")
      .text("INVOICE", { align: "right" });
    doc
      .fontSize(10)
      .fillColor("#475569")
      .text(`Invoice #: ${order.invoiceNumber}`, { align: "right" })
      .text(`Order ID: ${order.id}`, { align: "right" })
      .text(`Date: ${formatInvoiceDate(order.createdAt)}`, { align: "right" })
      .moveDown(2);

    const billTop = doc.y;
    doc.fontSize(11).fillColor("#0f172a").text("Bill to", 50, billTop);
    doc
      .fontSize(10)
      .fillColor("#334155")
      .text(customerName(order), 50, billTop + 16)
      .text(`@${order.username}`, 50, doc.y)
      .text(order.email?.trim() || "—", 50, doc.y);

    doc
      .fontSize(10)
      .fillColor("#334155")
      .text("Payment method", 300, billTop)
      .text("Store credit (simulated)", 300, billTop + 16)
      .text(`Balance after: ${formatPrice(order.balanceAfterCents)}`, 300, doc.y);

    doc.moveDown(2.5);

    const tableTop = doc.y;
    const colItem = 50;
    const colQty = 320;
    const colUnit = 380;
    const colTotal = 480;

    doc
      .rect(50, tableTop, pageWidth, 22)
      .fill("#e2e8f0");
    doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold");
    doc.text("Item", colItem + 8, tableTop + 6);
    doc.text("Qty", colQty, tableTop + 6);
    doc.text("Unit price", colUnit, tableTop + 6);
    doc.text("Line total", colTotal, tableTop + 6, { width: 70, align: "right" });

    let rowY = tableTop + 28;
    doc.font("Helvetica").fontSize(9).fillColor("#334155");

    for (const line of order.lines) {
      if (rowY > doc.page.height - 120) {
        doc.addPage();
        rowY = 50;
      }
      doc.text(line.productName, colItem + 8, rowY, { width: 250 });
      doc.text(String(line.quantity), colQty, rowY);
      doc.text(formatPrice(line.unitPriceCents), colUnit, rowY);
      doc.text(formatPrice(line.lineTotalCents), colTotal, rowY, {
        width: 70,
        align: "right",
      });
      rowY += 22;
    }

    doc
      .moveTo(50, rowY + 8)
      .lineTo(50 + pageWidth, rowY + 8)
      .strokeColor("#cbd5e1")
      .stroke();

    rowY += 24;
    doc.fontSize(11).fillColor("#0f172a").font("Helvetica-Bold");
    doc.text("Total (CAD)", colUnit, rowY);
    doc.text(formatPrice(order.totalCents), colTotal, rowY, {
      width: 70,
      align: "right",
    });

    doc.moveDown(4);
    doc
      .fontSize(9)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(
        "This is a simulated purchase receipt for the ByteMarket school project. No real payment was processed.",
        { align: "center", width: pageWidth },
      );

    doc.end();
  });
}
