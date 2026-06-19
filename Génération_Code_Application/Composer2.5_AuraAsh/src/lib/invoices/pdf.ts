import PDFDocument from "pdfkit";
import { formatPrice } from "@/lib/utils";
import type { InvoiceData } from "./types";

function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function customerName(customer: InvoiceData["customer"]): string {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ");
  return fullName || customer.username;
}

export function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc
      .fontSize(26)
      .fillColor("#2C2C2C")
      .text("AuraAsh", { continued: true })
      .fillColor("#C45C3E")
      .text("  Invoice");

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#6B6B6B")
      .text("Handcrafted home fragrance — simulated purchase receipt");

    doc.moveDown(1.5);
    doc
      .fontSize(11)
      .fillColor("#2C2C2C")
      .text(`Invoice #: ${invoice.invoiceNumber}`)
      .text(`Order ID: ${invoice.orderId}`)
      .text(`Date: ${formatInvoiceDate(invoice.createdAt)}`);

    doc.moveDown(1);
    doc.fontSize(12).fillColor("#2C2C2C").text("Bill to", { underline: true });
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .fillColor("#4A4A4A")
      .text(customerName(invoice.customer))
      .text(`Username: ${invoice.customer.username}`);

    if (invoice.customer.email) {
      doc.text(`Email: ${invoice.customer.email}`);
    }

    doc.moveDown(1.5);

    const tableTop = doc.y;
    const colName = doc.page.margins.left;
    const colQty = colName + pageWidth * 0.55;
    const colUnit = colName + pageWidth * 0.68;
    const colTotal = colName + pageWidth * 0.82;

    doc
      .fontSize(10)
      .fillColor("#FFFFFF")
      .rect(colName, tableTop, pageWidth, 22)
      .fill();

    doc.fillColor("#2C2C2C");
    doc.text("Item", colName + 8, tableTop + 6, { width: pageWidth * 0.5 });
    doc.text("Qty", colQty, tableTop + 6, { width: 40, align: "right" });
    doc.text("Unit", colUnit, tableTop + 6, { width: 60, align: "right" });
    doc.text("Total", colTotal, tableTop + 6, { width: 70, align: "right" });

    let rowY = tableTop + 28;

    invoice.items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc
          .rect(colName, rowY - 4, pageWidth, 22)
          .fillColor("#F7F4EF")
          .fill();
      }

      doc.fillColor("#2C2C2C").fontSize(10);
      doc.text(item.name, colName + 8, rowY, { width: pageWidth * 0.5 });
      doc.text(String(item.quantity), colQty, rowY, { width: 40, align: "right" });
      doc.text(formatPrice(item.unitPrice), colUnit, rowY, {
        width: 60,
        align: "right",
      });
      doc.text(formatPrice(item.lineTotal), colTotal, rowY, {
        width: 70,
        align: "right",
      });

      rowY += 24;
    });

    doc.moveDown(2);
    const summaryY = Math.max(rowY + 16, doc.y);

    doc
      .fontSize(12)
      .fillColor("#2C2C2C")
      .text(`Total paid: ${formatPrice(invoice.total)}`, colUnit, summaryY, {
        width: pageWidth * 0.18 + 70,
        align: "right",
      });

    doc
      .fontSize(10)
      .fillColor("#6B6B6B")
      .text(
        `Remaining account balance: ${formatPrice(invoice.balanceAfter)}`,
        colUnit,
        summaryY + 20,
        { width: pageWidth * 0.18 + 70, align: "right" },
      );

    doc.moveDown(3);
    doc
      .fontSize(9)
      .fillColor("#8A8A8A")
      .text(
        "This document confirms a simulated purchase on AuraAsh. No physical shipment is associated with this order.",
        { align: "center" },
      );

    doc.end();
  });
}
