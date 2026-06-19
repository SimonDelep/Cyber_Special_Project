from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewAuthor, ReviewCreate, ReviewPublic, ReviewUpdate
from app.services.products import require_product


def _to_public(review: Review) -> ReviewPublic:
    return ReviewPublic(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        title=review.title,
        body=review.body,
        image_url=review.image_url,
        author=ReviewAuthor.model_validate(review.user),
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def list_product_reviews(db: Session, product_id: int) -> list[ReviewPublic]:
    require_product(db, product_id)
    reviews = db.scalars(
        select(Review)
        .where(Review.product_id == product_id)
        .options(joinedload(Review.user))
        .order_by(Review.created_at.desc())
    ).all()
    return [_to_public(r) for r in reviews]


def get_review(db: Session, review_id: int) -> Review | None:
    return db.scalar(
        select(Review).where(Review.id == review_id).options(joinedload(Review.user))
    )


def create_review(db: Session, product_id: int, user: User, payload: ReviewCreate) -> ReviewPublic:
    product = require_product(db, product_id)
    if not product.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product is not available")

    existing = db.scalar(
        select(Review).where(Review.product_id == product_id, Review.user_id == user.id)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product",
        )

    review = Review(
        product_id=product_id,
        user_id=user.id,
        rating=payload.rating,
        title=payload.title.strip() if payload.title else None,
        body=payload.body.strip(),
        image_url=payload.image_url,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    review = get_review(db, review.id)
    assert review is not None
    return _to_public(review)


def update_review(db: Session, review: Review, user: User, payload: ReviewUpdate) -> ReviewPublic:
    if review.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if payload.rating is not None:
        review.rating = payload.rating
    if payload.title is not None:
        review.title = payload.title.strip() or None
    if payload.body is not None:
        review.body = payload.body.strip()
    if payload.image_url is not None:
        review.image_url = payload.image_url

    db.add(review)
    db.commit()
    db.refresh(review)
    review = get_review(db, review.id)
    assert review is not None
    return _to_public(review)


def delete_review(db: Session, review: Review, user: User, *, is_admin: bool = False) -> None:
    if review.user_id != user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    db.delete(review)
    db.commit()


def require_review(db: Session, review_id: int) -> Review:
    review = get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review
