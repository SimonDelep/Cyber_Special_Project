import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth/api-session";
import { generateInvoicePdf } from "@/lib/invoice/generate-pdf";
import { getOrderForUser } from "@/lib/orders/server";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const { orderId } = await context.params;
  const order = await getOrderForUser(orderId, auth.userId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const pdf = await generateInvoicePdf({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    totalCents: order.totalCents,
    balanceAfterCents: order.balanceAfterCents,
    simulated: order.simulated,
    customer: {
      username: order.user.username,
      email: order.user.email,
      displayName: order.user.displayName,
    },
    lines: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
  });

  const filename = `invoice-${order.orderNumber}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
