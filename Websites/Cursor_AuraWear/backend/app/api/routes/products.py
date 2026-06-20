from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.schemas.product import ProductPublic
from app.services.products import list_product_categories, list_products_filtered, require_product

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductPublic])
def get_products(
    db: DbSession,
    q: str | None = Query(default=None, max_length=200),
    category: str | None = Query(default=None, max_length=100),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort: str = Query(
        default="newest",
        pattern="^(newest|oldest|price_asc|price_desc|name_asc|name_desc)$",
    ),
) -> list[ProductPublic]:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price",
        )
    products = list_products_filtered(
        db,
        q=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        include_inactive=False,
    )
    return [ProductPublic.model_validate(p) for p in products]


@router.get("/categories", response_model=list[str])
def get_product_categories(db: DbSession) -> list[str]:
    return list_product_categories(db, include_inactive=False)


@router.get("/{product_id}", response_model=ProductPublic)
def get_product_by_id(product_id: int, db: DbSession) -> ProductPublic:
    product = require_product(db, product_id)
    if not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductPublic.model_validate(product)
