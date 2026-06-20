import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatPrice } from "@/lib/format";
import type { OrderRecord } from "./types";

const BRAND = rgb(0.23, 0.46, 0.38);
const INK = rgb(0.1, 0.14, 0.13);
const MUTED = rgb(0.36, 0.42, 0.4);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-CA", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function generateInvoicePdf(order: OrderRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - 56;

  page.drawText("PrepPro Aesthetic", {
    x: 48,
    y,
    size: 22,
    font: fontBold,
    color: BRAND,
  });
  y -= 22;
  page.drawText("Meal prep containers · Simulated commerce", {
    x: 48,
    y,
    size: 10,
    font: fontRegular,
    color: MUTED,
  });

  y -= 40;
  page.drawText("INVOICE", {
    x: 48,
    y,
    size: 18,
    font: fontBold,
    color: INK,
  });

  const metaX = width - 240;
  let metaY = height - 56;
  const metaLines: [string, string][] = [
    ["Invoice #", order.invoiceNumber],
    ["Order ID", String(order.id)],
    ["Date", formatDate(order.createdAt)],
    ["Payment", "Account balance (simulated)"],
  ];
  for (const [label, value] of metaLines) {
    page.drawText(label, {
      x: metaX,
      y: metaY,
      size: 9,
      font: fontRegular,
      color: MUTED,
    });
    page.drawText(truncate(value, 36), {
      x: metaX + 72,
      y: metaY,
      size: 9,
      font: fontBold,
      color: INK,
    });
    metaY -= 16;
  }

  y -= 36;
  page.drawText("Bill to", {
    x: 48,
    y,
    size: 10,
    font: fontBold,
    color: MUTED,
  });
  y -= 18;
  page.drawText(order.customerDisplayName, {
    x: 48,
    y,
    size: 12,
    font: fontBold,
    color: INK,
  });
  y -= 16;
  page.drawText(order.customerEmail, {
    x: 48,
    y,
    size: 10,
    font: fontRegular,
    color: INK,
  });
  y -= 14;
  page.drawText(`@${order.customerUsername}`, {
    x: 48,
    y,
    size: 10,
    font: fontRegular,
    color: MUTED,
  });

  y -= 36;
  const colX = { item: 48, qty: 340, unit: 400, total: 480 };
  page.drawRectangle({
    x: 48,
    y: y - 4,
    width: width - 96,
    height: 22,
    color: rgb(0.93, 0.97, 0.95),
  });
  page.drawText("Item", { x: colX.item, y, size: 9, font: fontBold, color: INK });
  page.drawText("Qty", { x: colX.qty, y, size: 9, font: fontBold, color: INK });
  page.drawText("Unit", { x: colX.unit, y, size: 9, font: fontBold, color: INK });
  page.drawText("Total", { x: colX.total, y, size: 9, font: fontBold, color: INK });

  y -= 28;
  for (const line of order.lines) {
    if (y < 120) break;
    page.drawText(truncate(line.name, 42), {
      x: colX.item,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    page.drawText(String(line.quantity), {
      x: colX.qty,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    page.drawText(formatPrice(line.unitPriceCents), {
      x: colX.unit,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    page.drawText(formatPrice(line.lineTotalCents), {
      x: colX.total,
      y,
      size: 10,
      font: fontRegular,
      color: INK,
    });
    y -= 20;
  }

  y -= 12;
  page.drawLine({
    start: { x: 48, y },
    end: { x: width - 48, y },
    thickness: 1,
    color: rgb(0.85, 0.92, 0.89),
  });
  y -= 24;
  page.drawText("Order total", {
    x: colX.unit - 20,
    y,
    size: 12,
    font: fontBold,
    color: INK,
  });
  page.drawText(formatPrice(order.totalCents), {
    x: colX.total - 10,
    y,
    size: 14,
    font: fontBold,
    color: BRAND,
  });

  y -= 48;
  page.drawText(
    "This document confirms a simulated purchase on PrepPro Aesthetic. No payment gateway was used.",
    { x: 48, y, size: 8, font: fontRegular, color: MUTED, maxWidth: width - 96 },
  );
  y -= 14;
  page.drawText("Thank you for your order.", {
    x: 48,
    y,
    size: 9,
    font: fontRegular,
    color: MUTED,
  });

  return pdf.save();
}
