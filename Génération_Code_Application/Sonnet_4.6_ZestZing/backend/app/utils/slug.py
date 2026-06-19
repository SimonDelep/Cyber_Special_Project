import re

from sqlalchemy.orm import Session

from app.models.product import Product


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "product"


def unique_product_slug(db: Session, base_slug: str, exclude_id: int | None = None) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = db.query(Product).filter(Product.slug == slug)
        if exclude_id is not None:
            query = query.filter(Product.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1
