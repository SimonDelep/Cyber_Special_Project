import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { generateInvoicePdf } from "@/lib/invoice/generate-pdf";
import { parseLineItems } from "@/lib/invoice/types";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return jsonError("Not authenticated", 401);

    const { orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) return jsonError("Invoice not found", 404);

    if (order.userId !== sessionUser.id && !isAdmin(sessionUser)) {
      return jsonError("You do not have access to this invoice", 403);
    }

    const lineItems = parseLineItems(order.lineItems);
    if (lineItems.length === 0) {
      return jsonError("Invoice has no line items", 500);
    }

    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: order.invoiceNumber,
      orderId: order.id,
      issuedAt: order.createdAt,
      customer: {
        username: order.user.username,
        displayName: order.user.displayName,
        email: order.user.email,
      },
      lineItems,
      totalCents: order.totalCents,
    });

    const filename = `invoice-${order.invoiceNumber}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[invoices/pdf GET]", err);
    return jsonError("Failed to generate invoice PDF", 500);
  }
}
