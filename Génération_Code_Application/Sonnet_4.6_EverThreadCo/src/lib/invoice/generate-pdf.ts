import PDFDocument from "pdfkit";
import { formatPrice } from "@/lib/format";

export type InvoiceLine = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type InvoiceData = {
  orderNumber: string;
  createdAt: Date;
  totalCents: number;
  balanceAfterCents: number;
  simulated: boolean;
  customer: {
    username: string;
    email: string;
    displayName: string | null;
  };
  lines: InvoiceLine[];
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const customerName =
      data.customer.displayName?.trim() || data.customer.username;

    doc
      .fontSize(22)
      .fillColor("#2d2a26")
      .text("EverThread Co", { continued: false });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#6b6560").text("Sustainable essentials");
    doc.moveDown(2);

    doc.fontSize(18).fillColor("#2d2a26").text("INVOICE");
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#4a4540");
    doc.text(`Invoice number: ${data.orderNumber}`);
    doc.text(`Date: ${formatDate(data.createdAt)}`);
    if (data.simulated) {
      doc.text("Status: Simulated purchase (account balance)");
    }
    doc.moveDown(1.5);

    doc.fontSize(11).fillColor("#2d2a26").text("Bill to");
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#4a4540");
    doc.text(customerName);
    doc.text(`@${data.customer.username}`);
    doc.text(data.customer.email);
    doc.moveDown(2);

    const tableTop = doc.y;
    const colName = 50;
    const colQty = 320;
    const colUnit = 380;
    const colTotal = 480;

    doc.fontSize(9).fillColor("#6b6560");
    doc.text("Item", colName, tableTop);
    doc.text("Qty", colQty, tableTop);
    doc.text("Unit", colUnit, tableTop);
    doc.text("Total", colTotal, tableTop, { width: 80, align: "right" });

    let y = tableTop + 18;
    doc.fontSize(10).fillColor("#2d2a26");

    for (const line of data.lines) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const nameHeight = doc.heightOfString(line.productName, {
        width: 250,
      });
      doc.text(line.productName, colName, y, { width: 250 });
      doc.text(String(line.quantity), colQty, y);
      doc.text(formatPrice(line.unitPriceCents), colUnit, y);
      doc.text(formatPrice(line.lineTotalCents), colTotal, y, {
        width: 80,
        align: "right",
      });
      y += Math.max(nameHeight, 14) + 8;
    }

    doc
      .moveTo(50, y + 4)
      .lineTo(545, y + 4)
      .strokeColor("#d4cfc8")
      .stroke();
    y += 20;

    doc.fontSize(11).fillColor("#2d2a26");
    doc.text("Total charged", 380, y);
    doc.text(formatPrice(data.totalCents), colTotal, y, {
      width: 80,
      align: "right",
    });
    y += 20;
    doc.fontSize(10).fillColor("#6b6560");
    doc.text("Account balance after purchase", 380, y);
    doc.text(formatPrice(data.balanceAfterCents), colTotal, y, {
      width: 80,
      align: "right",
    });

    doc.moveDown(4);
    doc
      .fontSize(8)
      .fillColor("#8a847c")
      .text(
        "This invoice documents a simulated checkout on your EverThread account. No real payment card or external processor was used.",
        50,
        doc.y,
        { width: 495, align: "left" },
      );

    doc.end();
  });
}
