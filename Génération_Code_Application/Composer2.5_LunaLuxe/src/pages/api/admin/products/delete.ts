import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteProduct, getProductById } from '@/lib/admin/products';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const id = Number(form.get('id'));
  const confirm = String(form.get('confirmName') ?? '').trim();

  if (!id) {
    return redirectResponse('/admin?tab=products&error=Invalid+product');
  }

  const product = await getProductById(id);
  if (!product) {
    return redirectResponse('/admin?tab=products&error=Product+not+found');
  }

  if (confirm !== product.name) {
    return redirectResponse('/admin?tab=products&error=Product+name+confirmation+does+not+match');
  }

  try {
    await deleteProduct(id);
    await logEvent({
      eventType: EventType.ADMIN_PRODUCT_DELETE,
      severity: 'warning',
      message: `Admin "${admin.username}" deleted product "${product.name}"`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { productId: id, productName: product.name },
    });
    return redirectResponse('/admin?tab=products&success=Product+deleted');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Delete failed';
    return redirectResponse(`/admin?tab=products&error=${encodeURIComponent(msg)}`);
  }
};
