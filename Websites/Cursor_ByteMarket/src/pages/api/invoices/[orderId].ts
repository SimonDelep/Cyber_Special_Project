import type { APIRoute } from "astro";
import { resolveAuthUser } from "@/lib/auth";
import { generateInvoicePdf } from "@/lib/invoices/pdf";
import { getOrderForUser } from "@/lib/orders";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals, cookies }) => {
  const user = resolveAuthUser(locals, cookies);
  if (!user) {
    return new Response("Sign in to download invoices.", { status: 401 });
  }

  const orderId = Number(params.orderId);
  if (!Number.isInteger(orderId) || orderId < 1) {
    return new Response("Invalid order.", { status: 400 });
  }

  const order = getOrderForUser(orderId, user.id);
  if (!order) {
    return new Response("Invoice not found.", { status: 404 });
  }

  try {
    const pdf = await generateInvoicePdf(order);
    const filename = `invoice-${order.invoiceNumber}.pdf`;

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[invoice] PDF generation failed:", err);
    return new Response("Could not generate invoice PDF.", { status: 500 });
  }
};
