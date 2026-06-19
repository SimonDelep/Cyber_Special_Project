import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { resolveAuthUser } from "@/lib/auth";
import { deleteProduct, parsePriceToCents, updateProduct } from "@/lib/admin/products";
import {
  pathWithMessage,
  readFormCheckbox,
  readFormInt,
  readFormString,
} from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, params, redirect }) => {
  const actor = resolveAuthUser(locals, cookies);
  if (!actor || actor.role !== "admin") {
    return redirect(pathWithMessage("/admin/products", "error", "Admin access required."));
  }

  const productId = Number(params.id);
  if (!Number.isFinite(productId)) {
    return redirect(pathWithMessage("/admin/products", "error", "Invalid product ID."));
  }

  const returnPath = `/admin/products/${productId}`;
  const formData = await request.formData();
  const action = await readFormString(formData, "action");

  if (action === "delete") {
    const result = deleteProduct(productId);
    if (!result.ok) {
      return redirect(pathWithMessage("/admin/products", "error", result.error ?? "Delete failed."));
    }
    logSystemEvent({
      eventType: AuditEvent.ADMIN_PRODUCT_DELETE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} deleted product #${productId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetResource: `product:${productId}`,
      request,
    });
    return redirect(pathWithMessage("/admin/products", "success", "Product deleted."));
  }

  if (action === "update") {
    const slug = await readFormString(formData, "slug");
    const name = await readFormString(formData, "name");
    const description = await readFormString(formData, "description");
    const priceInput = await readFormString(formData, "price");
    const stock = readFormInt(formData, "stock");
    const categoryId = readFormInt(formData, "categoryId");
    const imageUrl = await readFormString(formData, "imageUrl");
    const featured = readFormCheckbox(formData, "featured");

    const price = parsePriceToCents(priceInput);
    if (price.error) {
      return redirect(pathWithMessage(returnPath, "error", price.error));
    }

    const result = updateProduct(productId, {
      slug,
      name,
      description,
      priceCents: price.cents,
      stock: stock ?? undefined,
      categoryId: categoryId ?? null,
      imageUrl: imageUrl || null,
      featured,
    });

    if (result.error) {
      return redirect(pathWithMessage(returnPath, "error", result.error));
    }

    logSystemEvent({
      eventType: AuditEvent.ADMIN_PRODUCT_UPDATE,
      category: "admin",
      outcome: "success",
      message: `Admin @${actor.username} updated product #${productId}.`,
      actorUserId: actor.id,
      actorUsername: actor.username,
      targetResource: `product:${productId}`,
      metadata: { slug, stock },
      request,
    });

    return redirect(pathWithMessage(returnPath, "success", "Product updated."));
  }

  return redirect(pathWithMessage(returnPath, "error", "Unknown action."));
};
