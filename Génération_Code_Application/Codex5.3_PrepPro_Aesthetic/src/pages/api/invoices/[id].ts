import type { APIRoute } from "astro";
import { findOrderById } from "@/db/orders";
import { parseIdParam } from "@/lib/admin/guard";
import { isAdmin } from "@/lib/auth/rbac";
import { errorResponse } from "@/lib/api/response";
import { generateInvoicePdf } from "@/lib/invoices/pdf";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return errorResponse("Sign in to download invoices.", 401);
  }

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid invoice id.", 400);

  const order = findOrderById(id);
  if (!order) return errorResponse("Invoice not found.", 404);

  const ownsOrder = order.userId === locals.user.id;
  if (!ownsOrder && !isAdmin(locals.user)) {
    return errorResponse("You do not have access to this invoice.", 403);
  }

  try {
    const pdfBytes = await generateInvoicePdf(order);
    const filename = `invoice-${order.invoiceNumber}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return errorResponse("Could not generate invoice PDF.", 500);
  }
};
