import PDFDocument from "pdfkit";

import { siteConfig } from "@/config/site";
import { formatCents } from "@/lib/format";
import type { InvoiceData } from "@/lib/invoice/types";

function formatInvoiceDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(date);
}

export function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { invoice: company } = siteConfig;

    doc
      .fontSize(22)
      .fillColor("#2c1810")
      .text(company.companyName, { continued: false });

    doc
      .fontSize(10)
      .fillColor("#4a3228")
      .text(company.addressLines.join("\n"))
      .text(company.supportEmail)
      .moveDown(1.5);

    doc
      .fontSize(18)
      .fillColor("#2c1810")
      .text("INVOICE", { align: "right" });

    doc
      .fontSize(10)
      .fillColor("#4a3228")
      .text(`Invoice #${invoice.invoiceNumber}`, { align: "right" })
      .text(`Order ID: ${invoice.orderId}`, { align: "right" })
      .text(`Date: ${formatInvoiceDate(invoice.issuedAt)}`, { align: "right" })
      .moveDown(2);

    doc.fontSize(11).fillColor("#2c1810").text("Bill to", { underline: true });
    doc
      .fontSize(10)
      .fillColor("#4a3228")
      .text(invoice.customer.name)
      .text(`@${invoice.customer.username}`);
    if (invoice.customer.email) {
      doc.text(invoice.customer.email);
    }
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const colName = 50;
    const colQty = 320;
    const colUnit = 380;
    const colTotal = 480;

    doc.fontSize(10).fillColor("#5c6b52");
    doc.text("Item", colName, tableTop);
    doc.text("Qty", colQty, tableTop);
    doc.text("Unit price", colUnit, tableTop);
    doc.text("Amount", colTotal, tableTop);

    doc
      .moveTo(50, tableTop + 16)
      .lineTo(562, tableTop + 16)
      .strokeColor("#8b9a7d")
      .stroke();

    let y = tableTop + 24;
    doc.fillColor("#2c1810");

    for (const item of invoice.lineItems) {
      doc.fontSize(10).text(item.name, colName, y, { width: 250 });
      doc.text(String(item.quantity), colQty, y);
      doc.text(formatCents(item.unitPriceCents), colUnit, y);
      doc.text(formatCents(item.lineTotalCents), colTotal, y);
      y += 22;
    }

    doc
      .moveTo(50, y + 4)
      .lineTo(562, y + 4)
      .strokeColor("#8b9a7d")
      .stroke();

    y += 20;
    doc
      .fontSize(12)
      .fillColor("#2c1810")
      .text("Total paid", colUnit, y);
    doc.text(formatCents(invoice.totalCents), colTotal, y);

    y += 36;
    doc
      .fontSize(10)
      .fillColor("#4a3228")
      .text(`Payment method: ${invoice.paymentMethod}`, 50, y);

    y += 28;
    doc
      .fontSize(9)
      .fillColor("#5c6b52")
      .text(
        "This invoice confirms a simulated purchase on RoastRitual. No physical payment card was charged.",
        50,
        y,
        { width: 500 },
      );

    doc.end();
  });
}
