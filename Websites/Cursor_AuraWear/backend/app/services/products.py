import re
import unicodedata
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "product"


def unique_slug(db: Session, name: str, exclude_id: int | None = None) -> str:
    base = slugify(name)
    slug = base
    counter = 1
    while True:
        existing = db.scalar(select(Product).where(Product.slug == slug))
        if existing is None or (exclude_id is not None and existing.id == exclude_id):
            return slug
        counter += 1
        slug = f"{base}-{counter}"


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def list_products(db: Session, include_inactive: bool = False) -> list[Product]:
    return list_products_filtered(db, include_inactive=include_inactive)


def list_products_filtered(
    db: Session,
    *,
    q: str | None = None,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    sort: str = "newest",
    include_inactive: bool = False,
) -> list[Product]:
    query = select(Product)
    if not include_inactive:
        query = query.where(Product.is_active.is_(True))

    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
            )
        )

    if category and category.strip():
        query = query.where(Product.category == category.strip().lower())

    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)

    sort_options = {
        "newest": Product.id.desc(),
        "oldest": Product.id.asc(),
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "name_asc": Product.name.asc(),
        "name_desc": Product.name.desc(),
    }
    query = query.order_by(sort_options.get(sort, Product.id.desc()))
    return list(db.scalars(query).all())


def list_product_categories(db: Session, include_inactive: bool = False) -> list[str]:
    products = list_products(db, include_inactive=include_inactive)
    categories = sorted({p.category for p in products})
    return categories


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(
        name=payload.name.strip(),
        slug=unique_slug(db, payload.name),
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        category=payload.category.strip().lower(),
        image_url=payload.image_url,
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, payload: ProductUpdate) -> Product:
    if payload.name is not None:
        product.name = payload.name.strip()
        product.slug = unique_slug(db, product.name, exclude_id=product.id)
    if payload.description is not None:
        product.description = payload.description or None
    if payload.price is not None:
        product.price = payload.price
    if payload.stock is not None:
        product.stock = payload.stock
    if payload.category is not None:
        product.category = payload.category.strip().lower()
    if payload.image_url is not None:
        product.image_url = payload.image_url or None
    if payload.is_active is not None:
        product.is_active = payload.is_active

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    db.delete(product)
    db.commit()


def require_product(db: Session, product_id: int) -> Product:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
