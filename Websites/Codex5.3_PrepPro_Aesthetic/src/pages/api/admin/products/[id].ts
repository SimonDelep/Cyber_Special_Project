import type { APIRoute } from "astro";
import { requireAdminApi, parseIdParam } from "@/lib/admin/guard";
import { validateProductInput, type ProductCategory } from "@/lib/products/validate";
import {
  deleteProduct,
  findProductById,
  slugTaken,
  updateProduct,
} from "@/db/products";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = ({ locals, params }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid product id.", 400);

  const product = findProductById(id);
  if (!product) return errorResponse("Product not found.", 404);

  return jsonResponse({ product });
};

export const PUT: APIRoute = async ({ locals, params, request }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid product id.", 400);

  const existing = findProductById(id);
  if (!existing) return errorResponse("Product not found.", 404);

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.slug !== undefined) updates.slug = String(body.slug).trim();
    if (body.description !== undefined) {
      updates.description = String(body.description).trim();
    }
    if (body.category !== undefined) updates.category = String(body.category);
    if (body.priceCents !== undefined) updates.priceCents = Number(body.priceCents);
    if (body.imageUrl !== undefined) updates.imageUrl = String(body.imageUrl).trim();
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.stackable !== undefined) updates.stackable = Boolean(body.stackable);
    if (body.leakProof !== undefined) updates.leakProof = Boolean(body.leakProof);
    if (body.capacityMl !== undefined) {
      updates.capacityMl =
        body.capacityMl === null || body.capacityMl === ""
          ? null
          : Number(body.capacityMl);
    }

    const validation = validateProductInput({
      name: updates.name as string | undefined,
      slug: updates.slug as string | undefined,
      description: updates.description as string | undefined,
      category: updates.category as string | undefined,
      priceCents: updates.priceCents as number | undefined,
      imageUrl: updates.imageUrl as string | undefined,
      capacityMl: updates.capacityMl as number | null | undefined,
    });
    if (!validation.ok) {
      return errorResponse(validation.error, 400);
    }

    if (updates.slug && slugTaken(updates.slug as string, id)) {
      return errorResponse("Slug is already in use.", 409);
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ product: existing });
    }

    const product = updateProduct(id, updates as Parameters<typeof updateProduct>[1]);
    if (!product) return errorResponse("Product not found.", 404);

    return jsonResponse({ product });
  } catch {
    return errorResponse("Failed to update product.", 500);
  }
};

export const DELETE: APIRoute = ({ locals, params }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  const id = parseIdParam(params.id);
  if (!id) return errorResponse("Invalid product id.", 400);

  const existing = findProductById(id);
  if (!existing) return errorResponse("Product not found.", 404);

  deleteProduct(id);
  return jsonResponse({ ok: true });
};
