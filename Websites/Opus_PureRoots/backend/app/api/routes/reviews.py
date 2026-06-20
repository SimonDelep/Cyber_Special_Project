from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.review import ReviewCreateJson, ReviewRead
from app.services.product import get_product
from app.services.review import (
    ReviewError,
    create_or_update_review,
    create_review_from_json,
    list_reviews_for_product,
    review_to_read,
)

router = APIRouter(tags=["reviews"])


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
def get_product_reviews(product_id: int, db: DbSession) -> list[ReviewRead]:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    reviews = list_reviews_for_product(db, product_id)
    return [ReviewRead.model_validate(review_to_read(r)) for r in reviews]


@router.post("/products/{product_id}/reviews", response_model=ReviewRead)
async def create_product_review_upload(
    product_id: int,
    user: CurrentUser,
    db: DbSession,
    rating: int = Form(..., ge=1, le=5),
    comment: str = Form(..., min_length=3, max_length=3000),
    image_url: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
) -> ReviewRead:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    try:
        if image_url and not image_url.startswith(("http://", "https://")):
            raise ReviewError("Image URL must start with http:// or https://")
        content = await file.read() if file and file.filename else None
        content_type = file.content_type if file and file.filename else None
        review = create_or_update_review(
            db,
            user,
            product,
            rating=rating,
            comment=comment,
            image_url=image_url or None,
            image_content=content,
            image_content_type=content_type,
        )
    except ReviewError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    return ReviewRead.model_validate(review_to_read(review))


@router.post("/products/{product_id}/reviews/json", response_model=ReviewRead)
def create_product_review_json(
    product_id: int,
    body: ReviewCreateJson,
    user: CurrentUser,
    db: DbSession,
) -> ReviewRead:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    try:
        review = create_review_from_json(db, user, product, body)
    except ReviewError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    db.refresh(review, attribute_names=["user"])
    return ReviewRead.model_validate(review_to_read(review))
