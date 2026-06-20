from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.core.uploads import delete_local_upload, save_upload
from app.database import get_db
from app.models import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewImageUrlUpdate,
    ReviewRead,
    ReviewUpdate,
)

router = APIRouter(tags=["reviews"])


def _review_to_read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        username=review.user.username,
        user_avatar=review.user.profile_picture_url,
        rating=review.rating,
        title=review.title,
        content=review.content,
        image_url=review.image_url,
        created_at=review.created_at,
    )


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
def list_reviews(product_id: int, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_review_to_read(r) for r in reviews]


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already reviewed this product. Edit your existing review instead.",
        )

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=payload.rating,
        title=payload.title,
        content=payload.content,
        image_url=payload.image_url,
    )
    db.add(review)
    db.commit()
    review = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review.id)
        .first()
    )
    return _review_to_read(review)


@router.put("/reviews/{review_id}", response_model=ReviewRead)
def update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    if payload.rating is not None:
        review.rating = payload.rating
    if payload.title is not None:
        review.title = payload.title
    if payload.content is not None:
        review.content = payload.content
    if payload.image_url is not None:
        delete_local_upload(review.image_url, "reviews")
        review.image_url = payload.image_url or None

    db.commit()
    db.refresh(review)
    return _review_to_read(review)


@router.put("/reviews/{review_id}/image-url", response_model=ReviewRead)
def set_review_image_url(
    review_id: int,
    payload: ReviewImageUrlUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    delete_local_upload(review.image_url, "reviews")
    review.image_url = payload.image_url.strip()
    db.commit()
    db.refresh(review)
    return _review_to_read(review)


@router.post("/reviews/{review_id}/image", response_model=ReviewRead)
async def upload_review_image(
    review_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    delete_local_upload(review.image_url, "reviews")
    review.image_url = await save_upload(file, "reviews", str(review.id))
    db.commit()
    db.refresh(review)
    return _review_to_read(review)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    delete_local_upload(review.image_url, "reviews")
    db.delete(review)
    db.commit()
    return None
