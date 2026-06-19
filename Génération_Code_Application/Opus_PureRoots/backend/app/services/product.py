from decimal import Decimal

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.product import Product


def list_products(db: Session) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.category, Product.name)))


def get_product_by_slug(db: Session, slug: str) -> Product | None:
    return db.scalar(select(Product).where(Product.slug == slug))


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def search_products(
    db: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = "name",
) -> list[Product]:
    stmt = select(Product)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.slug.ilike(term),
            )
        )

    if category and category.strip():
        stmt = stmt.where(Product.category == category.strip())

    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)

    if sort == "price_asc":
        stmt = stmt.order_by(Product.price.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price.desc())
    else:
        stmt = stmt.order_by(Product.category, Product.name)

    return list(db.scalars(stmt))
