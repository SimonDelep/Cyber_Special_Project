import re
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.admin import ProductCreate, ProductUpdate


class ProductError(Exception):
    pass


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-") or "product"


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def list_all_products(db: Session) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.category, Product.name)))


def create_product(db: Session, data: ProductCreate) -> Product:
    slug = data.slug or _slugify(data.name)
    if db.scalar(select(Product).where(Product.slug == slug)):
        raise ProductError("Product slug already exists")

    product = Product(
        name=data.name,
        slug=slug,
        category=data.category,
        description=data.description,
        price=data.price,
        image_url=data.image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    if data.slug is not None and data.slug != product.slug:
        if db.scalar(select(Product).where(Product.slug == data.slug, Product.id != product.id)):
            raise ProductError("Product slug already exists")
        product.slug = data.slug

    if data.name is not None:
        product.name = data.name
    if data.category is not None:
        product.category = data.category
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price
    if data.image_url is not None:
        product.image_url = data.image_url or None

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    try:
        db.delete(product)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ProductError(
            "This product cannot be deleted because it is still referenced elsewhere."
        ) from exc
