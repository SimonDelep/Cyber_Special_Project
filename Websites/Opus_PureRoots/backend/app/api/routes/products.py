from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.schemas.product import ProductRead
from app.services.product import get_product_by_slug as fetch_product_by_slug
from app.services.product import list_products, search_products

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def get_products(
    db: DbSession,
    search: Optional[str] = Query(default=None, max_length=100),
    category: Optional[str] = Query(default=None, max_length=80),
    min_price: Optional[Decimal] = Query(default=None, ge=0),
    max_price: Optional[Decimal] = Query(default=None, ge=0),
    sort: str = Query(default="name", pattern="^(name|price_asc|price_desc)$"),
) -> list[ProductRead]:
    has_filters = any([search, category, min_price is not None, max_price is not None, sort != "name"])
    if has_filters:
        products = search_products(
            db,
            search=search,
            category=category,
            min_price=min_price,
            max_price=max_price,
            sort=sort,
        )
    else:
        products = list_products(db)
    return [ProductRead.model_validate(p) for p in products]


@router.get("/slug/{slug}", response_model=ProductRead)
def get_product_by_slug_route(slug: str, db: DbSession) -> ProductRead:
    product = fetch_product_by_slug(db, slug)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductRead.model_validate(product)
