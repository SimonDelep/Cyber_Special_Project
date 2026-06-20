import { NextResponse } from "next/server";
import { Role } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import {
  getInvoiceData,
  getInvoiceDataByOrderId,
} from "@/lib/invoices/queries";
import { generateInvoicePdf } from "@/lib/invoices/pdf";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await context.params;

    const invoiceData =
      user.role === Role.ADMIN
        ? await getInvoiceDataByOrderId(id)
        : await getInvoiceData(id, user.id);

    if (!invoiceData) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdf = await generateInvoicePdf(invoiceData);
    const filename = `${invoiceData.invoiceNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
