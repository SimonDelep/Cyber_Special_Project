import type { APIRoute } from "astro";
import { AuditEvent, logSystemEvent } from "@/lib/audit";
import { importProductsFromCsv } from "@/lib/admin/product-csv";
import { resolveAuthUser } from "@/lib/auth";
import { pathWithMessage } from "@/lib/http";

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const actor = resolveAuthUser(locals, cookies);
  if (!actor || actor.role !== "admin") {
    return redirect(pathWithMessage("/admin/products", "error", "Admin access required."));
  }

  const formData = await request.formData();
  const file = formData.get("csv_file");

  if (!(file instanceof File) || file.size === 0) {
    return redirect(
      pathWithMessage("/admin/products/import", "error", "Choose a CSV file to upload."),
    );
  }

  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
    return redirect(
      pathWithMessage(
        "/admin/products/import",
        "error",
        "Upload a .csv file (comma-separated values).",
      ),
    );
  }

  const maxBytes = 512 * 1024;
  if (file.size > maxBytes) {
    return redirect(
      pathWithMessage("/admin/products/import", "error", "CSV file must be 512 KB or smaller."),
    );
  }

  const csvText = await file.text();
  const result = importProductsFromCsv(csvText);

  if (result.parseError) {
    return redirect(
      pathWithMessage("/admin/products/import", "error", result.parseError),
    );
  }

  logSystemEvent({
    eventType: AuditEvent.ADMIN_PRODUCT_CREATE,
    category: "admin",
    outcome: result.created > 0 ? "success" : "failure",
    message: `Admin @${actor.username} imported products from CSV (${result.created} created, ${result.failed} failed).`,
    actorUserId: actor.id,
    actorUsername: actor.username,
    metadata: {
      source: "csv",
      created: result.created,
      failed: result.failed,
      fileName: file.name,
    },
    request,
  });

  const returnPath = "/admin/products/import";
  if (result.created === 0 && result.failed > 0) {
    const firstError = result.results.find((r) => !r.ok)?.error ?? "Import failed.";
    return redirect(
      pathWithMessage(
        returnPath,
        "error",
        `No products created. ${result.failed} row(s) failed. Row ${result.results.find((r) => !r.ok)?.rowNumber}: ${firstError}`,
      ),
    );
  }

  let message = `Imported ${result.created} product(s) from CSV.`;
  if (result.failed > 0) {
    message += ` ${result.failed} row(s) were skipped due to errors.`;
  }

  const url = new URL(returnPath, "http://internal");
  url.searchParams.set("success", message);
  url.searchParams.set("created", String(result.created));
  url.searchParams.set("failed", String(result.failed));

  return redirect(url.pathname + url.search);
};
