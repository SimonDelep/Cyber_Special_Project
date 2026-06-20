from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product, ProductCategory
from app.schemas.product import ProductPublic

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductPublic])
def list_products(
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, max_length=200),
    category: ProductCategory | None = None,
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort: str = Query(default="name", pattern="^(name|price_asc|price_desc)$"),
):
    query = db.query(Product)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
                Product.slug.ilike(term),
            )
        )

    if category is not None:
        query = query.filter(Product.category == category)

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.name.asc())

    return query.all()


@router.get("/{product_id}", response_model=ProductPublic)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
