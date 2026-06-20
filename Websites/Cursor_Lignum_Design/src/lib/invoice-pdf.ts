import PDFDocument from "pdfkit";
import { siteConfig } from "@/config/site";

export type InvoiceLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceData = {
  orderNumber: string;
  createdAt: Date;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  items: InvoiceLineItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(
    amount,
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const company = siteConfig.name;
    const companyEmail = siteConfig.links.email;

    doc.fontSize(22).font("Helvetica-Bold").text(company, { align: "left" });
    doc.fontSize(10).font("Helvetica").fillColor("#555555");
    doc.text(companyEmail);
    doc.text("Facture — Simulation de commande");
    doc.moveDown(1.5);

    doc.fillColor("#000000").fontSize(16).font("Helvetica-Bold").text("FACTURE");
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica");
    doc.text(`N° de commande : ${data.orderNumber}`);
    doc.text(`Date : ${formatDate(data.createdAt)}`);
    doc.text(`Statut : ${data.status}`);
    doc.moveDown(1);

    doc.font("Helvetica-Bold").text("Client");
    doc.font("Helvetica");
    doc.text(data.customerName);
    doc.text(data.customerEmail);
    if (data.customerPhone) doc.text(data.customerPhone);
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").text("Adresse de livraison");
    doc.font("Helvetica").text(data.shippingAddress, { width: 500 });
    doc.moveDown(1.5);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 280;
    const col3 = 340;
    const col4 = 420;

    doc.font("Helvetica-Bold");
    doc.text("Article", col1, tableTop);
    doc.text("Qté", col2, tableTop);
    doc.text("Prix unit.", col3, tableTop);
    doc.text("Total", col4, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font("Helvetica").fontSize(9);

    for (const item of data.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(item.name.slice(0, 60), col1, y, { width: 220 });
      doc.text(String(item.quantity), col2, y);
      doc.text(formatMoney(item.unitPrice), col3, y);
      doc.text(formatMoney(item.lineTotal), col4, y);
      y += 22;
    }

    doc.moveDown(2);
    const summaryY = Math.max(y + 20, doc.y);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Sous-total : ${formatMoney(data.subtotal)}`, 350, summaryY, { align: "right" });
    doc.text(`Livraison : ${formatMoney(data.shippingCost)}`, 350, summaryY + 16, {
      align: "right",
    });
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`Total : ${formatMoney(data.total)}`, 350, summaryY + 36, { align: "right" });

    doc.moveDown(3);
    doc.fontSize(8).font("Helvetica").fillColor("#666666");
    doc.text(
      "Document généré automatiquement suite à une simulation de commande. Aucun paiement réel n’a été traité.",
      { align: "center", width: 500 },
    );

    doc.end();
  });
}
