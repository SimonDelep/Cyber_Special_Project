import type { APIRoute } from "astro";
import { requireAdminApi } from "@/lib/admin/guard";
import { importProductsFromCsv } from "@/lib/products/csv";
import { logEventFromRequest } from "@/lib/monitoring/logger";
import { errorResponse, jsonResponse } from "@/lib/api/response";

const MAX_BYTES = 512 * 1024;

export const POST: APIRoute = async ({ locals, request }) => {
  const admin = requireAdminApi(locals);
  if (admin instanceof Response) return admin;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse('Upload a CSV file in the "file" field.', 400);
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return errorResponse("File must have a .csv extension.", 400);
    }

    if (file.size > MAX_BYTES) {
      return errorResponse("CSV file must be 512 KB or smaller.", 400);
    }

    const text = await file.text();
    const result = importProductsFromCsv(text);

    logEventFromRequest(request, {
      eventType: "admin.products.import",
      status: result.created > 0 ? "success" : "info",
      userId: admin.id,
      actorLabel: admin.username,
      message: `Admin ${admin.username} imported products from CSV (${result.created} created, ${result.failed} failed).`,
      metadata: {
        fileName: file.name,
        created: result.created,
        failed: result.failed,
      },
    });

    return jsonResponse(result, result.created > 0 ? 201 : 200);
  } catch {
    return errorResponse("CSV import failed.", 500);
  }
};
