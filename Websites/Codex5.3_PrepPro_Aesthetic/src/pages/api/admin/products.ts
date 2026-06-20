import type { APIRoute } from "astro";
import { requireAdminApi } from "@/lib/admin/guard";
import {
  slugify,
  validateProductInput,
  type ProductCategory,
} from "@/lib/products/validate";
import { createProduct, listProducts, slugTaken } from "@/db/products";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ locals }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const products = listProducts();
  return jsonResponse({ products, count: products.length });
};

export const POST: APIRoute = async ({ locals, request }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    let slug = String(body.slug ?? "").trim() || slugify(name);
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "meal-prep") as ProductCategory;
    const priceCents = Number(body.priceCents);
    const imageUrl = String(body.imageUrl ?? "").trim();
    const featured = Boolean(body.featured);
    const stackable = body.stackable !== false;
    const leakProof = Boolean(body.leakProof);
    const capacityMl =
      body.capacityMl === null || body.capacityMl === ""
        ? null
        : Number(body.capacityMl);

    const validation = validateProductInput({
      name,
      slug,
      description,
      category,
      priceCents,
      imageUrl,
      capacityMl,
    });
    if (!validation.ok) {
      return errorResponse(validation.error, 400);
    }

    if (!name) {
      return errorResponse("Product name is required.", 400);
    }

    if (slugTaken(slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = createProduct({
      name,
      slug,
      description,
      category,
      priceCents,
      imageUrl: imageUrl || "/images/solo-prep.svg",
      featured,
      stackable,
      leakProof,
      capacityMl: capacityMl ?? null,
    });

    return jsonResponse({ product }, 201);
  } catch {
    return errorResponse("Failed to create product.", 500);
  }
};
