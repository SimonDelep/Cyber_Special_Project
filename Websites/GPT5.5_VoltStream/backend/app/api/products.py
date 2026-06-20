from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductRead

router = APIRouter(prefix="/products", tags=["products"])

SortOption = Literal["name", "price_asc", "price_desc"]


@router.get("", response_model=list[ProductRead])
def list_products(
    search: str | None = Query(None, description="Search name and description"),
    category: str | None = Query(None, description="keyboard, mouse, or desk_mat"),
    min_price_cents: int | None = Query(None, ge=0),
    max_price_cents: int | None = Query(None, ge=0),
    sort: SortOption = Query("name"),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.description.ilike(term),
            )
        )

    if category and category != "all":
        query = query.filter(Product.category == category)

    if min_price_cents is not None:
        query = query.filter(Product.price_cents >= min_price_cents)
    if max_price_cents is not None:
        query = query.filter(Product.price_cents <= max_price_cents)

    if sort == "price_asc":
        query = query.order_by(Product.price_cents.asc(), Product.name.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price_cents.desc(), Product.name.asc())
    else:
        query = query.order_by(Product.name.asc())

    return query.all()


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
