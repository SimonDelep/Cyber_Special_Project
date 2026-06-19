import type { APIRoute } from 'astro';
import { importProductsFromCsv } from '@/lib/admin/csv-products';
import { requireAdminApi } from '@/lib/auth/guards';
import { errorResponse, jsonResponse } from '@/lib/http';
import { logEvent } from '@/lib/monitoring';

export const POST: APIRoute = async (context) => {
  const admin = requireAdminApi(context);
  if (admin instanceof Response) return admin;

  const formData = await context.request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return errorResponse('Please upload a CSV file.', 400);
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return errorResponse('File must have a .csv extension.', 400);
  }

  const maxBytes = 512 * 1024;
  if (file.size > maxBytes) {
    return errorResponse('CSV file must be 512 KB or smaller.', 400);
  }

  try {
    const csvText = await file.text();
    const result = await importProductsFromCsv(csvText);

    await logEvent({
      category: 'admin',
      action: 'admin.products.csv_import',
      severity: result.failed > 0 ? 'warning' : 'info',
      status: result.created > 0 ? 'success' : 'failure',
      message: `CSV import: ${result.created} created, ${result.failed} failed.`,
      userId: admin.id,
      username: admin.username,
      metadata: {
        fileName: file.name,
        created: result.created,
        failed: result.failed,
      },
      request: context.request,
    });

    return jsonResponse(result, result.created > 0 ? 201 : 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CSV import failed.';
    await logEvent({
      category: 'admin',
      action: 'admin.products.csv_import',
      severity: 'error',
      status: 'failure',
      message: `CSV import failed: ${message}`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
    });
    return errorResponse(message, 400);
  }
};
