from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewPublic
from app.services.images import save_image_file, validate_image_url

router = APIRouter(tags=["reviews"])


def _review_to_public(review: Review) -> ReviewPublic:
    return ReviewPublic(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        username=review.user.username,
        rating=review.rating,
        comment=review.comment,
        image_url=review.image_url,
        created_at=review.created_at,
    )


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/products/{product_id}/reviews", response_model=list[ReviewPublic])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    _get_product_or_404(db, product_id)
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [_review_to_public(r) for r in reviews]


@router.post("/products/{product_id}/reviews", response_model=ReviewPublic, status_code=201)
def create_review(
    product_id: int,
    body: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_product_or_404(db, product_id)

    existing = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.product_id == product_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this product",
        )

    image_url = None
    if body.image_url:
        image_url = validate_image_url(body.image_url)

    review = Review(
        user_id=current_user.id,
        product_id=product_id,
        rating=body.rating,
        comment=body.comment.strip(),
        image_url=image_url,
    )
    db.add(review)
    db.flush()
    db.refresh(review)
    _ = review.user
    db.commit()
    db.refresh(review)
    return _review_to_public(review)


@router.post("/products/{product_id}/reviews/upload-image")
async def upload_review_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_product_or_404(db, product_id)
    url = await save_image_file(file, "reviews", str(current_user.id))
    return {"image_url": url}
