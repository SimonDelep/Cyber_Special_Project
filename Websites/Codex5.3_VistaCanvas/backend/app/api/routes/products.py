from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_optional_user
from app.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.product import ProductCatalogItem, ProductDetail
from app.schemas.review import (
    ReviewCreate,
    ReviewImageUrlRequest,
    ReviewPublic,
    ReviewUpdate,
)
from app.services.review_image import (
    delete_local_review_image,
    save_review_image,
)

router = APIRouter(prefix="/products", tags=["products"])

SortOption = Literal["name", "price_asc", "price_desc", "newest", "rating"]


def _validate_image_url(url: str | None) -> str | None:
    if url is None:
        return None
    value = url.strip()
    if not value:
        return None
    if not (
        value.startswith("http://")
        or value.startswith("https://")
        or value.startswith("/uploads/")
    ):
        raise HTTPException(status_code=400, detail="Invalid image URL")
    return value


def _get_product_by_slug(db: Session, slug: str) -> Product:
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _get_review_or_404(db: Session, review_id: int, product_id: int) -> Review:
    review = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review_id, Review.product_id == product_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


def _review_to_public(review: Review) -> ReviewPublic:
    return ReviewPublic(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        username=review.user.username,
        rating=review.rating,
        title=review.title,
        body=review.body,
        image_url=review.image_url,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _product_stats(db: Session, product_id: int) -> tuple[int, float | None]:
    row = (
        db.query(func.count(Review.id), func.avg(Review.rating))
        .filter(Review.product_id == product_id)
        .first()
    )
    count = int(row[0] or 0)
    avg = float(row[1]) if row[1] is not None else None
    return count, avg


def _to_catalog_item(db: Session, product: Product) -> ProductCatalogItem:
    count, avg = _product_stats(db, product.id)
    return ProductCatalogItem(
        id=product.id,
        slug=product.slug,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        image_url=product.image_url,
        created_at=product.created_at,
        review_count=count,
        average_rating=round(avg, 1) if avg is not None else None,
    )


@router.get("/categories", response_model=list[str])
def list_categories(db: Annotated[Session, Depends(get_db)]) -> list[str]:
    rows = db.query(Product.category).distinct().order_by(Product.category).all()
    return [row[0] for row in rows]


@router.get("", response_model=list[ProductCatalogItem])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    q: Annotated[str | None, Query(max_length=200)] = None,
    category: Annotated[str | None, Query(max_length=80)] = None,
    min_price: Annotated[Decimal | None, Query(ge=0)] = None,
    max_price: Annotated[Decimal | None, Query(ge=0)] = None,
    sort: SortOption = "name",
) -> list[ProductCatalogItem]:
    query = db.query(Product)

    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(Product.name.ilike(term), Product.description.ilike(term))
        )
    if category:
        query = query.filter(Product.category == category.strip())
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    products = query.all()

    items = [_to_catalog_item(db, p) for p in products]

    if sort == "price_asc":
        items.sort(key=lambda x: x.price)
    elif sort == "price_desc":
        items.sort(key=lambda x: x.price, reverse=True)
    elif sort == "newest":
        items.sort(key=lambda x: x.created_at, reverse=True)
    elif sort == "rating":
        items.sort(
            key=lambda x: (x.average_rating is not None, x.average_rating or 0),
            reverse=True,
        )
    else:
        items.sort(key=lambda x: x.name.lower())

    return items


@router.get("/{slug}/reviews", response_model=list[ReviewPublic])
def list_product_reviews(
    slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[ReviewPublic]:
    product = _get_product_by_slug(db, slug)
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_review_to_public(r) for r in reviews]


@router.post(
    "/{slug}/reviews",
    response_model=ReviewPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    slug: str,
    payload: ReviewCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ReviewPublic:
    product = _get_product_by_slug(db, slug)
    existing = (
        db.query(Review)
        .filter(Review.product_id == product.id, Review.user_id == user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already reviewed this product. Edit your existing review instead.",
        )

    review = Review(
        product_id=product.id,
        user_id=user.id,
        rating=payload.rating,
        title=payload.title.strip(),
        body=payload.body.strip(),
        image_url=_validate_image_url(payload.image_url),
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    review = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review.id)
        .first()
    )
    return _review_to_public(review)


@router.put("/{slug}/reviews/{review_id}", response_model=ReviewPublic)
def update_review(
    slug: str,
    review_id: int,
    payload: ReviewUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ReviewPublic:
    product = _get_product_by_slug(db, slug)
    review = _get_review_or_404(db, review_id, product.id)
    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    if payload.rating is not None:
        review.rating = payload.rating
    if payload.title is not None:
        review.title = payload.title.strip()
    if payload.body is not None:
        review.body = payload.body.strip()
    if payload.image_url is not None:
        new_url = _validate_image_url(payload.image_url)
        if new_url != review.image_url:
            delete_local_review_image(review.image_url)
            review.image_url = new_url

    db.commit()
    db.refresh(review)
    return _review_to_public(review)


@router.put("/{slug}/reviews/{review_id}/image-url", response_model=ReviewPublic)
def set_review_image_url(
    slug: str,
    review_id: int,
    payload: ReviewImageUrlRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> ReviewPublic:
    product = _get_product_by_slug(db, slug)
    review = _get_review_or_404(db, review_id, product.id)
    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    delete_local_review_image(review.image_url)
    review.image_url = _validate_image_url(payload.image_url)
    db.commit()
    db.refresh(review)
    return _review_to_public(review)


@router.post("/{slug}/reviews/{review_id}/image", response_model=ReviewPublic)
async def upload_review_image(
    slug: str,
    review_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
) -> ReviewPublic:
    product = _get_product_by_slug(db, slug)
    review = _get_review_or_404(db, review_id, product.id)
    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    delete_local_review_image(review.image_url)
    review.image_url = await save_review_image(review.id, file)
    db.commit()
    db.refresh(review)
    return _review_to_public(review)


@router.delete("/{slug}/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    slug: str,
    review_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> None:
    product = _get_product_by_slug(db, slug)
    review = _get_review_or_404(db, review_id, product.id)
    if review.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your review")

    delete_local_review_image(review.image_url)
    db.delete(review)
    db.commit()


@router.get("/{slug}", response_model=ProductDetail)
def get_product_by_slug(
    slug: str,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User | None, Depends(get_optional_user)],
) -> ProductDetail:
    product = _get_product_by_slug(db, slug)
    return _to_catalog_item(db, product)


# Keep simple list for backwards compatibility - actually changed response model
# Landing page uses getProducts - need to update frontend to use catalog or keep ProductPublic compatible
# ProductCatalogItem extends ProductPublic fields - frontend Product type still works, extra fields optional
