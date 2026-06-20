import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildInvoicePdfBuffer } from "@/lib/invoices/build-invoice-pdf";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to download invoices." }, { status: 401 });
  }

  const { orderId } = await context.params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const isOwner = order.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You do not have access to this invoice." }, { status: 403 });
  }

  const pdfBuffer = await buildInvoicePdfBuffer({
    invoiceNumber: order.invoiceNumber,
    orderDate: order.createdAt,
    customerUsername: order.customerUsername,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalCents: order.totalCents,
    balanceBeforeCents: order.balanceBeforeCents,
    balanceAfterCents: order.balanceAfterCents,
    items: order.items.map((item) => ({
      productName: item.productName,
      category: item.category,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
  });

  const filename = `${order.invoiceNumber}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
