import PDFDocument from "pdfkit";
import { SITE_NAME } from "@/lib/constants";

export type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  total: number;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export type InvoiceCustomer = {
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

function formatCad(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

export function generateInvoicePdf(
  order: InvoiceOrder,
  customer: InvoiceCustomer,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const customerName =
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      customer.username;

    const invoiceDate = order.createdAt.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Toronto",
    });

    doc
      .fontSize(22)
      .fillColor("#0ea5e9")
      .text(SITE_NAME, { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666666").text("Travel Tech & Wireless Power");
    doc.moveDown(1.5);

    doc.fontSize(18).fillColor("#000000").text("INVOICE", { continued: false });
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor("#333333");
    doc.text(`Invoice number: ${order.orderNumber}`);
    doc.text(`Date: ${invoiceDate}`);
    doc.text(`Status: Paid (simulated)`);
    doc.moveDown(1);

    doc.fontSize(11).fillColor("#000000").text("Bill to:", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#333333");
    doc.text(customerName);
    doc.text(`@${customer.username}`);
    doc.text(customer.email);
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const colName = 50;
    const colQty = 320;
    const colPrice = 380;
    const colTotal = 460;

    doc.fontSize(9).fillColor("#666666");
    doc.text("Item", colName, tableTop);
    doc.text("Qty", colQty, tableTop);
    doc.text("Unit", colPrice, tableTop);
    doc.text("Total", colTotal, tableTop);

    doc
      .moveTo(50, tableTop + 14)
      .lineTo(545, tableTop + 14)
      .strokeColor("#e5e5e5")
      .stroke();

    let y = tableTop + 22;
    doc.fontSize(10).fillColor("#000000");

    for (const item of order.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.productName, colName, y, { width: 250 });
      doc.text(String(item.quantity), colQty, y);
      doc.text(formatCad(item.unitPrice), colPrice, y);
      doc.text(formatCad(item.lineTotal), colTotal, y);
      y += 22;
    }

    doc
      .moveTo(50, y + 4)
      .lineTo(545, y + 4)
      .strokeColor("#e5e5e5")
      .stroke();

    y += 18;
    doc.fontSize(12).fillColor("#000000");
    doc.text("Total (CAD):", colPrice, y);
    doc.fontSize(14).fillColor("#0ea5e9").text(formatCad(order.total), colTotal, y);

    doc.moveDown(3);
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text(
        "This is a simulated invoice for the AeroPure e-commerce demo. No actual payment was processed via card or bank transfer — the purchase was debited from your in-app account balance.",
        { align: "center", width: 495 },
      );

    doc.end();
  });
}
