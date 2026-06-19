from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreateJson

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
EXT_BY_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class ReviewError(Exception):
    pass


def list_reviews_for_product(db: Session, product_id: int) -> list[Review]:
    return list(
        db.scalars(
            select(Review)
            .where(Review.product_id == product_id)
            .options(joinedload(Review.user))
            .order_by(Review.created_at.desc())
        )
    )


def _save_review_image(review_id: int, content: bytes, content_type: str) -> str:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ReviewError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")
    max_bytes = settings.max_avatar_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise ReviewError(f"Image must be under {settings.max_avatar_size_mb} MB.")

    settings.reviews_dir.mkdir(parents=True, exist_ok=True)
    ext = EXT_BY_TYPE[content_type]
    path = settings.reviews_dir / f"review_{review_id}{ext}"
    path.write_bytes(content)
    return f"/uploads/reviews/review_{review_id}{ext}"


def create_or_update_review(
    db: Session,
    user: User,
    product: Product,
    *,
    rating: int,
    comment: str,
    image_url: str | None = None,
    image_content: bytes | None = None,
    image_content_type: str | None = None,
) -> Review:
    review = db.scalar(
        select(Review).where(Review.user_id == user.id, Review.product_id == product.id)
    )

    if review:
        review.rating = rating
        review.comment = comment
        if image_url:
            review.image_url = image_url
    else:
        review = Review(
            user_id=user.id,
            product_id=product.id,
            rating=rating,
            comment=comment,
            image_url=image_url,
        )
        db.add(review)
        db.flush()

    if image_content and image_content_type:
        review.image_url = _save_review_image(review.id, image_content, image_content_type)
    elif image_url:
        review.image_url = image_url

    db.commit()
    db.refresh(review)
    loaded = db.scalar(
        select(Review).where(Review.id == review.id).options(joinedload(Review.user))
    )
    return loaded or review


def review_to_read(review: Review) -> dict:
    return {
        "id": review.id,
        "product_id": review.product_id,
        "user_id": review.user_id,
        "username": review.user.username if review.user else "user",
        "rating": review.rating,
        "comment": review.comment,
        "image_url": review.image_url,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }


def create_review_from_json(db: Session, user: User, product: Product, data: ReviewCreateJson) -> Review:
    return create_or_update_review(
        db,
        user,
        product,
        rating=data.rating,
        comment=data.comment,
        image_url=data.image_url,
    )
