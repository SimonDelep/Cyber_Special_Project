import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { toApiError } from "@/lib/errors";
import { getOrderForInvoice } from "@/lib/invoice";
import { buildInvoicePdf, invoiceFilename } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  if (!orderId?.trim()) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const order = await getOrderForInvoice(
      orderId,
      session.user.id,
      session.user.role
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const pdf = await buildInvoicePdf(order);
    const filename = invoiceFilename(order.id);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const { body, status } = toApiError(err);
    return NextResponse.json(body, { status });
  }
}
