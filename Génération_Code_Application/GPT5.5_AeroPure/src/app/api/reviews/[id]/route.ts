import { prisma } from "@/lib/prisma";
import { LogCategory, LogLevel } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/auth/api";
import { logEvent } from "@/lib/logging/logger";
import { LOG_ACTIONS } from "@/lib/logging/actions";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required", 401);

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: { product: { select: { name: true, slug: true } } },
  });
  if (!review) return jsonError("Review not found", 404);

  if (review.userId !== user.id && user.role !== "ADMIN") {
    return jsonError("You can only delete your own reviews", 403);
  }

  await prisma.review.delete({ where: { id } });

  await logEvent({
    level: LogLevel.INFO,
    category: LogCategory.REVIEW,
    action: LOG_ACTIONS.REVIEW_DELETE,
    message: `Review deleted by "${user.username}" on "${review.product.name}"`,
    userId: user.id,
    username: user.username,
    metadata: { reviewId: id, productSlug: review.product.slug },
    request,
  });

  return jsonSuccess({ message: "Review deleted" });
}
