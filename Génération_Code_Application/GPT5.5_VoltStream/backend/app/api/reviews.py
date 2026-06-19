from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewRead
from app.services.review_upload import normalize_image_url, save_review_image

router = APIRouter(tags=["reviews"])


def _to_review_read(review: Review) -> ReviewRead:
    return ReviewRead(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=review.user.full_name,
        rating=review.rating,
        title=review.title,
        body=review.body,
        image_url=review.image_url,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


def _get_product_or_404(product_id: int, db: Session) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _resolve_image_url(
    image_url: str | None,
    image_file: UploadFile | None,
) -> str | None:
    if image_file and image_file.filename:
        return save_review_image(image_file)
    return normalize_image_url(image_url)


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    _get_product_or_404(product_id, db)
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_to_review_read(r) for r in reviews]


@router.post("/products/{product_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    rating: int = Form(..., ge=1, le=5),
    title: str = Form(..., min_length=1, max_length=120),
    body: str = Form(..., min_length=10, max_length=5000),
    image_url: str | None = Form(None),
    image_file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_product_or_404(product_id, db)
    existing = db.query(Review).filter(Review.user_id == user.id, Review.product_id == product_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already reviewed this product. Edit your existing review instead.",
        )

    review = Review(
        product_id=product_id,
        user_id=user.id,
        rating=rating,
        title=title.strip(),
        body=body.strip(),
        image_url=_resolve_image_url(image_url, image_file),
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already reviewed this product.",
        )
    db.refresh(review)
    review = db.query(Review).options(joinedload(Review.user)).filter(Review.id == review.id).first()
    return _to_review_read(review)


@router.patch("/products/{product_id}/reviews/mine", response_model=ReviewRead)
def update_my_review(
    product_id: int,
    rating: int | None = Form(None),
    title: str | None = Form(None),
    body: str | None = Form(None),
    image_url: str | None = Form(None),
    clear_image: bool = Form(False),
    image_file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_product_or_404(product_id, db)
    review = db.query(Review).filter(Review.user_id == user.id, Review.product_id == product_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if rating is not None:
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be between 1 and 5")
        review.rating = rating
    if title is not None:
        review.title = title.strip()
    if body is not None:
        if len(body.strip()) < 10:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review body must be at least 10 characters")
        review.body = body.strip()

    if clear_image:
        review.image_url = None
    elif image_file and image_file.filename:
        review.image_url = save_review_image(image_file)
    elif image_url is not None:
        review.image_url = normalize_image_url(image_url)

    db.commit()
    review = db.query(Review).options(joinedload(Review.user)).filter(Review.id == review.id).first()
    return _to_review_read(review)


@router.delete("/products/{product_id}/reviews/mine", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_review(
    product_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.user_id == user.id, Review.product_id == product_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    db.delete(review)
    db.commit()
