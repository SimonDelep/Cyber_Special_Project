import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { InvoiceData } from "@/lib/invoice/types";
import { formatPrice } from "@/lib/format";

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const brandColor = rgb(0.12, 0.55, 0.95);
  const textDark = rgb(0.15, 0.15, 0.18);
  const textMuted = rgb(0.4, 0.42, 0.48);

  let y = height - 56;

  page.drawText("HydroFlasked", {
    x: 48,
    y,
    size: 22,
    font: fontBold,
    color: brandColor,
  });
  y -= 28;
  page.drawText("INVOICE", {
    x: 48,
    y,
    size: 14,
    font: fontBold,
    color: textDark,
  });

  const issuedLabel = data.issuedAt.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  page.drawText(`Invoice #: ${data.invoiceNumber}`, {
    x: width - 260,
    y: height - 56,
    size: 10,
    font: fontRegular,
    color: textDark,
  });
  page.drawText(`Date: ${issuedLabel}`, {
    x: width - 260,
    y: height - 72,
    size: 10,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText(`Order ID: ${data.orderId}`, {
    x: width - 260,
    y: height - 88,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  y -= 40;
  page.drawLine({
    start: { x: 48, y },
    end: { x: width - 48, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92),
  });
  y -= 28;

  page.drawText("Bill to", { x: 48, y, size: 10, font: fontBold, color: textMuted });
  y -= 16;
  const customerName = data.customer.displayName || data.customer.username;
  page.drawText(customerName, { x: 48, y, size: 12, font: fontBold, color: textDark });
  y -= 14;
  page.drawText(`@${data.customer.username}`, {
    x: 48,
    y,
    size: 10,
    font: fontRegular,
    color: textMuted,
  });
  if (data.customer.email) {
    y -= 14;
    page.drawText(data.customer.email, {
      x: 48,
      y,
      size: 10,
      font: fontRegular,
      color: textMuted,
    });
  }

  y -= 36;
  const colX = { item: 48, qty: 320, unit: 380, total: 480 };

  page.drawRectangle({
    x: 48,
    y: y - 4,
    width: width - 96,
    height: 22,
    color: rgb(0.95, 0.97, 1),
  });
  page.drawText("Item", { x: colX.item, y, size: 10, font: fontBold, color: textDark });
  page.drawText("Qty", { x: colX.qty, y, size: 10, font: fontBold, color: textDark });
  page.drawText("Unit", { x: colX.unit, y, size: 10, font: fontBold, color: textDark });
  page.drawText("Total", { x: colX.total, y, size: 10, font: fontBold, color: textDark });

  y -= 26;

  for (const line of data.lineItems) {
    if (y < 120) break;

    page.drawText(truncate(line.name, 42), {
      x: colX.item,
      y,
      size: 10,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(String(line.quantity), {
      x: colX.qty,
      y,
      size: 10,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(formatPrice(line.unitPriceCents), {
      x: colX.unit,
      y,
      size: 10,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(formatPrice(line.lineTotalCents), {
      x: colX.total,
      y,
      size: 10,
      font: fontRegular,
      color: textDark,
    });
    y -= 20;
  }

  y -= 12;
  page.drawLine({
    start: { x: 48, y },
    end: { x: width - 48, y },
    thickness: 1,
    color: rgb(0.88, 0.9, 0.92),
  });
  y -= 24;

  page.drawText("Total paid (simulation)", {
    x: colX.unit - 40,
    y,
    size: 11,
    font: fontBold,
    color: textDark,
  });
  page.drawText(formatPrice(data.totalCents), {
    x: colX.total,
    y,
    size: 14,
    font: fontBold,
    color: brandColor,
  });

  page.drawText(
    "This document confirms a simulated purchase on HydroFlasked.",
    {
      x: 48,
      y: 72,
      size: 8,
      font: fontRegular,
      color: textMuted,
    },
  );
  page.drawText("No physical shipment is issued.", {
    x: 48,
    y: 60,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText("Thank you for your order.", {
    x: 48,
    y: 48,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  return doc.save();
}
