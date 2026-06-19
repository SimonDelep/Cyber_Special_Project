import type { APIRoute } from 'astro';
import { getAdminFromCookies } from '../../../../lib/api/admin-guard';
import { errorResponse, jsonResponse } from '../../../../lib/api/response';
import { logEvent } from '../../../../lib/events/logger';
import {
  EVENT_ACTION,
  EVENT_CATEGORY,
  EVENT_OUTCOME,
} from '../../../../lib/events/constants';
import {
  assertCsvFileSize,
  importProductsFromCsv,
} from '../../../../lib/products/csv-import';

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = getAdminFromCookies(cookies);
  if (admin instanceof Response) return admin;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Expected multipart form data with a CSV file.');
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return errorResponse('No CSV file provided. Use form field name "file".');
  }

  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    return errorResponse('Upload must be a .csv file.');
  }

  const sizeError = assertCsvFileSize(file.size);
  if (sizeError) return errorResponse(sizeError);

  const csvText = await file.text();
  const summary = importProductsFromCsv(csvText);

  const hasHardFailure =
    summary.results.length === 1 &&
    summary.results[0]?.ok === false &&
    summary.created === 0 &&
    summary.skipped === 0;

  if (hasHardFailure) {
    logEvent({
      category: EVENT_CATEGORY.ADMIN,
      action: EVENT_ACTION.ADMIN_PRODUCT_IMPORT,
      outcome: EVENT_OUTCOME.FAILURE,
      message: `Admin "${admin.username}" CSV import failed: ${summary.results[0]?.ok === false ? summary.results[0].message : 'Invalid file'}.`,
      userId: admin.id,
      username: admin.username,
      request,
      metadata: { fileName: file.name },
    });
    return errorResponse(
      summary.results[0]?.ok === false ? summary.results[0].message : 'Import failed.',
      400,
    );
  }

  logEvent({
    category: EVENT_CATEGORY.ADMIN,
    action: EVENT_ACTION.ADMIN_PRODUCT_IMPORT,
    outcome: summary.failed > 0 ? EVENT_OUTCOME.FAILURE : EVENT_OUTCOME.SUCCESS,
    message: `Admin "${admin.username}" imported products from CSV: ${summary.created} created, ${summary.skipped} skipped, ${summary.failed} failed.`,
    userId: admin.id,
    username: admin.username,
    request,
    metadata: {
      fileName: file.name,
      created: summary.created,
      skipped: summary.skipped,
      failed: summary.failed,
    },
  });

  return jsonResponse({
    ok: true,
    created: summary.created,
    skipped: summary.skipped,
    failed: summary.failed,
    results: summary.results.map((r) =>
      r.ok
        ? { row: r.row, ok: true, productId: r.product.id, slug: r.product.slug }
        : { row: r.row, ok: false, error: r.message },
    ),
  });
};
