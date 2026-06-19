import { NextResponse } from "next/server";

import { requireAuthApi } from "@/lib/auth/api-auth";
import { generateInvoicePdf } from "@/lib/invoice/generate-pdf";
import { getOrderInvoiceData } from "@/lib/invoice/get-order-invoice";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const authResult = await requireAuthApi();
  if ("error" in authResult) return authResult.error;

  const { id: orderId } = await params;

  const invoice = await getOrderInvoiceData(orderId, authResult.user.id);
  if (!invoice) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const pdf = await generateInvoicePdf(invoice);
    const filename = `roastritual-invoice-${invoice.invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("[invoice]", error);
    return NextResponse.json(
      { error: "Unable to generate invoice" },
      { status: 500 },
    );
  }
}
