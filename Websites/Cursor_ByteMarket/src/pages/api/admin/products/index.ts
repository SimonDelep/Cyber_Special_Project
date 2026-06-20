import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { resolveAuthUser } from "@/lib/auth";
import { createProduct, parsePriceToCents } from "@/lib/admin/products";
import {
  pathWithMessage,
  readFormCheckbox,
  readFormInt,
  readFormString,
} from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const actor = resolveAuthUser(locals, cookies);
  if (!actor || actor.role !== "admin") {
    return redirect(pathWithMessage("/admin/products", "error", "Admin access required."));
  }

  const formData = await request.formData();
  const slug = await readFormString(formData, "slug");
  const name = await readFormString(formData, "name");
  const description = await readFormString(formData, "description");
  const priceInput = await readFormString(formData, "price");
  const stock = readFormInt(formData, "stock") ?? 0;
  const categoryId = readFormInt(formData, "categoryId");
  const imageUrl = await readFormString(formData, "imageUrl");
  const featured = readFormCheckbox(formData, "featured");

  const price = parsePriceToCents(priceInput);
  if (price.error) {
    return redirect(pathWithMessage("/admin/products/new", "error", price.error));
  }

  const result = createProduct({
    slug,
    name,
    description,
    priceCents: price.cents!,
    stock,
    categoryId: categoryId ?? null,
    imageUrl: imageUrl || null,
    featured,
  });

  if (result.error) {
    return redirect(pathWithMessage("/admin/products/new", "error", result.error));
  }

  logSystemEvent({
    eventType: AuditEvent.ADMIN_PRODUCT_CREATE,
    category: "admin",
    outcome: "success",
    message: `Admin @${actor.username} created product "${result.product!.name}".`,
    actorUserId: actor.id,
    actorUsername: actor.username,
    targetResource: `product:${result.product!.id}`,
    metadata: { slug: result.product!.slug, priceCents: price.cents },
    request,
  });

  return redirect(
    pathWithMessage(
      `/admin/products/${result.product!.id}`,
      "success",
      "Product created.",
    ),
  );
};
