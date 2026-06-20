import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";
import { logEvent } from "@/lib/event-log";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { orderNumber: rawOrderNumber } = await context.params;
  const orderNumber = decodeURIComponent(rawOrderNumber);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const sessionEmail = session.user.email.toLowerCase();
  const customerEmail = order.customer.email.toLowerCase();
  const isAdmin = session.user.role === "ADMIN";

  if (!isAdmin && sessionEmail !== customerEmail) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const items = order.items.map((item) => {
    const unitPrice = Number(item.unitPrice);
    const quantity = item.quantity;
    return {
      name: item.product.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    };
  });

  const invoiceData: InvoiceData = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
    customerEmail: order.customer.email,
    customerPhone: order.customer.phone,
    shippingAddress: order.shippingAddress,
    items,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
  };

  const pdfBuffer = await generateInvoicePdf(invoiceData);

  await logEvent({
    type: "invoice.downloaded",
    severity: "INFO",
    message: "Invoice PDF downloaded",
    userId: session.user.id,
    metadata: { orderNumber: order.orderNumber },
  });

  const filename = `facture-${order.orderNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
