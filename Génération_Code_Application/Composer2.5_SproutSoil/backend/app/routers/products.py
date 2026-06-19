from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product
from app.models.review import Review
from app.schemas.product import ProductRead

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_read(product: Product, db: Session) -> ProductRead:
    stats = (
        db.query(
            func.count(Review.id),
            func.avg(Review.rating),
        )
        .filter(Review.product_id == product.id)
        .first()
    )
    count = stats[0] or 0
    avg = float(stats[1]) if stats[1] is not None else None
    if avg is not None:
        avg = round(avg, 1)

    data = ProductRead.model_validate(product)
    return data.model_copy(update={"review_count": count, "average_rating": avg})


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Product.category).distinct().order_by(Product.category).all()
    return [row[0] for row in rows]


@router.get("", response_model=list[ProductRead])
def list_products(
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=100),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    sort: str = Query(default="name", pattern="^(name|price_asc|price_desc)$"),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Product.name.ilike(term)
            | Product.description.ilike(term)
            | Product.slug.ilike(term)
        )

    if category:
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

    products = query.all()
    return [_product_to_read(p, db) for p in products]


@router.get("/slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _product_to_read(product, db)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _product_to_read(product, db)
