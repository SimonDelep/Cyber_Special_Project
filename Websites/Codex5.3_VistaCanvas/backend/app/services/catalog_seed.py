"""Sample catalog data and idempotent seeding for local development."""

from sqlalchemy.orm import Session

from app.models.product import Product

SAMPLE_PRODUCTS: list[dict] = [
    {
        "slug": "misty-highland-dawn",
        "name": "Misty Highland Dawn",
        "description": "Moody vintage landscape print on archival matte paper — rolling hills lost in morning fog.",
        "category": "vintage-prints",
        "price": 49.99,
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    },
    {
        "slug": "coastal-fog-triptych",
        "name": "Coastal Fog Triptych",
        "description": "Framed canvas gallery set — three-panel coastal horizon in soft, muted tones.",
        "category": "gallery-sets",
        "price": 189.99,
        "image_url": "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    },
    {
        "slug": "alpine-lake-canvas",
        "name": "Alpine Lake Canvas",
        "description": "Large-format print-on-demand canvas with gallery wrap — crystal lake and snow peaks.",
        "category": "canvas-prints",
        "price": 129.99,
        "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    },
    {
        "slug": "storm-valley-vintage",
        "name": "Storm Valley Vintage",
        "description": "Dramatic valley under brooding clouds — faded sepia finish for a timeless wall piece.",
        "category": "vintage-prints",
        "price": 54.99,
        "image_url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    },
    {
        "slug": "golden-hour-meadow",
        "name": "Golden Hour Meadow",
        "description": "Warm light over wild meadows — premium canvas ready to anchor a living room.",
        "category": "canvas-prints",
        "price": 119.99,
        "image_url": "https://images.unsplash.com/photo-1418065460487-3e41a2042881?w=800&q=80",
    },
    {
        "slug": "northern-lights-panorama",
        "name": "Northern Lights Panorama",
        "description": "Wide panoramic print capturing aurora over still water — museum-grade color depth.",
        "category": "canvas-prints",
        "price": 149.99,
        "image_url": "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
    },
]


def ensure_sample_products(db: Session) -> bool:
    """Insert or refresh sample products. Returns True if the DB was changed."""
    existing = {p.slug: p for p in db.query(Product).all()}
    changed = False
    for item in SAMPLE_PRODUCTS:
        product = existing.get(item["slug"])
        if product is None:
            db.add(Product(**item))
            changed = True
        else:
            for key, value in item.items():
                if getattr(product, key) != value:
                    setattr(product, key, value)
                    changed = True
    if changed:
        db.commit()
    return changed
