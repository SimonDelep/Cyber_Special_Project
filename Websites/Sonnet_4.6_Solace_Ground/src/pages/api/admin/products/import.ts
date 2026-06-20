import type { APIRoute } from 'astro';
import { requireAdminApi, isAdminResponse } from '@/lib/admin/guard';
import { importProductsFromCsv } from '@/lib/admin/import-products';
import { errorResponse, jsonResponse } from '@/lib/api';
import { logEvent } from '@/lib/monitoring/logger';
import { LOG_ACTIONS } from '@/lib/monitoring/types';
import { toPublicProduct } from '@/types/product';

export const prerender = false;

const MAX_FILE_BYTES = 512 * 1024;
const MAX_ROWS = 200;

export const POST: APIRoute = async ({ request, locals }) => {
  const admin = requireAdminApi(locals);
  if (isAdminResponse(admin)) return admin;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Invalid form data.', 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File) || file.size === 0) {
    return errorResponse('Choose a CSV file to upload.', 400);
  }

  if (file.size > MAX_FILE_BYTES) {
    return errorResponse('CSV file is too large (max 512 KB).', 400);
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv')) {
    return errorResponse('File must be a .csv file.', 400);
  }

  const text = await file.text();
  const lineCount = text.split(/\r?\n/).filter((l) => l.trim()).length;
  if (lineCount > MAX_ROWS + 1) {
    return errorResponse(`CSV may contain at most ${MAX_ROWS} product rows.`, 400);
  }

  const result = importProductsFromCsv(text);

  if (result.created > 0) {
    logEvent({
      action: LOG_ACTIONS.ADMIN_PRODUCT_IMPORT,
      category: 'admin',
      status: 'success',
      message: `Admin imported ${result.created} product(s) from CSV`,
      userId: admin.id,
      username: admin.username,
      request,
      metadata: {
        created: result.created,
        failed: result.failed,
        fileName: file.name,
      },
    });
  }

  return jsonResponse({
    created: result.created,
    failed: result.failed,
    errors: result.errors,
    products: result.products.map(toPublicProduct),
  });
};
