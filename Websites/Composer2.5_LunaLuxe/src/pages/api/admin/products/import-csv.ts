import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { importProductsFromCsv } from '@/lib/admin/csv-products';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

const MAX_FILE_SIZE = 512 * 1024;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const file = form.get('csv');

  if (!file || !(file instanceof File)) {
    return redirectResponse('/admin?tab=products&error=Please+select+a+CSV+file');
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return redirectResponse('/admin?tab=products&error=File+must+be+a+.csv');
  }

  if (file.size === 0) {
    return redirectResponse('/admin?tab=products&error=CSV+file+is+empty');
  }

  if (file.size > MAX_FILE_SIZE) {
    return redirectResponse('/admin?tab=products&error=CSV+file+is+too+large+(max+512+KB)');
  }

  const csvText = await file.text();
  const result = await importProductsFromCsv(csvText);

  if (result.errors.length > 0 && result.created === 0) {
    const preview = result.errors.slice(0, 5).join(' | ');
    const suffix = result.errors.length > 5 ? ` (+${result.errors.length - 5} more)` : '';
    await logEvent({
      eventType: EventType.ADMIN_PRODUCT_IMPORT,
      severity: 'warning',
      message: `Admin "${admin.username}" CSV import failed`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { fileName: file.name, errors: result.errors },
    });
    return redirectResponse(
      `/admin?tab=products&error=${encodeURIComponent(preview + suffix)}`
    );
  }

  await logEvent({
    eventType: EventType.ADMIN_PRODUCT_IMPORT,
    severity: 'info',
    message: `Admin "${admin.username}" imported ${result.created} product(s) from CSV`,
    userId: admin.id,
    username: admin.username,
    request: context.request,
    metadata: {
      fileName: file.name,
      created: result.created,
      skipped: result.skipped,
      warnings: result.errors,
    },
  });

  let success = `Imported ${result.created} product${result.created !== 1 ? 's' : ''}`;
  if (result.skipped > 0) {
    success += ` (${result.skipped} skipped — slug already exists)`;
  }
  if (result.errors.length > 0) {
    const preview = result.errors.slice(0, 3).join(' | ');
    success += `. Warnings: ${preview}`;
  }

  return redirectResponse(`/admin?tab=products&success=${encodeURIComponent(success)}`);
};
