import type { APIRoute } from 'astro';
import { requireAdmin } from '@/lib/admin/guard';
import { createProduct, isValidCategory, slugify } from '@/lib/admin/products';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirectResponse } from '@/lib/auth/response';
import { logEvent } from '@/lib/monitoring/logger';
import { EventType } from '@/lib/monitoring/events';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const admin = requireAdmin(context);
  if (admin instanceof Response) return admin;

  const form = await context.request.formData();
  let slug = String(form.get('slug') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const price = Number(form.get('price'));
  const category = String(form.get('category') ?? '').trim();
  const imageUrl = String(form.get('imageUrl') ?? '').trim();
  const featured = form.has('featured');

  if (!name || !description || !imageUrl) {
    return redirectResponse('/admin?tab=products&error=Missing+required+product+fields');
  }

  if (!Number.isFinite(price) || price < 0) {
    return redirectResponse('/admin?tab=products&error=Invalid+price');
  }

  if (!isValidCategory(category)) {
    return redirectResponse('/admin?tab=products&error=Invalid+category');
  }

  if (!slug) slug = slugify(name);
  if (!slug) {
    return redirectResponse('/admin?tab=products&error=Invalid+slug');
  }

  const [existing] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (existing) {
    return redirectResponse('/admin?tab=products&error=Slug+already+exists');
  }

  try {
    await createProduct({ slug, name, description, price, category, imageUrl, featured });
    await logEvent({
      eventType: EventType.ADMIN_PRODUCT_CREATE,
      severity: 'info',
      message: `Admin "${admin.username}" created product "${name}"`,
      userId: admin.id,
      username: admin.username,
      request: context.request,
      metadata: { slug, name, price, category },
    });
    return redirectResponse('/admin?tab=products&success=Product+created');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Create failed';
    return redirectResponse(`/admin?tab=products&error=${encodeURIComponent(msg)}`);
  }
};
