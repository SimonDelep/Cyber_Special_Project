import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { updateProduct, isValidCategory } from '@/lib/admin/products';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  const id = Number(form.get('id'));
  const slug = String(form.get('slug') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const price = Number(form.get('price'));
  const category = String(form.get('category') ?? '').trim();
  const imageUrl = String(form.get('imageUrl') ?? '').trim();
  const featured = form.has('featured');

  if (!id || !slug || !name || !description || !imageUrl) {
    return redirectResponse('/admin?tab=products&error=Missing+required+fields');
  }

  if (!Number.isFinite(price) || price < 0) {
    return redirectResponse('/admin?tab=products&error=Invalid+price');
  }

  if (!isValidCategory(category)) {
    return redirectResponse('/admin?tab=products&error=Invalid+category');
  }

  const [slugConflict] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), ne(products.id, id)))
    .limit(1);

  if (slugConflict) {
    return redirectResponse('/admin?tab=products&error=Slug+already+in+use');
  }

  try {
    const updated = await updateProduct(id, {
      slug,
      name,
      description,
      price,
      category,
      imageUrl,
      featured,
    });
    if (!updated) {
      return redirectResponse('/admin?tab=products&error=Product+not+found');
    }
    await logEvent({
      eventType: EventType.ADMIN_PRODUCT_UPDATE,
      severity: 'info',
      message: `Admin "${admin.username}" updated product "${name}"`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { productId: id, slug, name, price },
    });
    return redirectResponse('/admin?tab=products&success=Product+updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Update failed';
    return redirectResponse(`/admin?tab=products&error=${encodeURIComponent(msg)}`);
  }
};
