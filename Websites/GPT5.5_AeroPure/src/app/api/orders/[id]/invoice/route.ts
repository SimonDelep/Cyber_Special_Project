import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/auth/api";
import { generateInvoicePdf } from "@/lib/invoice/generate-pdf";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!order) return jsonError("Order not found", 404);

  if (order.userId !== user.id && user.role !== "ADMIN") {
    return jsonError("Access denied", 403);
  }

  const pdfBuffer = await generateInvoicePdf(
    {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      total: Number(order.total),
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    },
    {
      username: order.user.username,
      email: order.user.email,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
    },
  );

  const filename = `invoice-${order.orderNumber}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
