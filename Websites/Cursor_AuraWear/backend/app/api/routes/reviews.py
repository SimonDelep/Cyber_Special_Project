from fastapi import APIRouter, File, UploadFile, status

from app.api.deps import AdminUser, CurrentUser, DbSession
from app.models.user import UserRole
from app.schemas.review import ReviewCreate, ReviewPublic, ReviewUpdate, ReviewUploadResponse
from app.services.reviews import (
    create_review,
    delete_review,
    list_product_reviews,
    require_review,
    update_review,
)
from app.services.uploads import save_review_image

router = APIRouter(tags=["reviews"])


@router.get("/products/{product_id}/reviews", response_model=list[ReviewPublic])
def get_product_reviews(product_id: int, db: DbSession) -> list[ReviewPublic]:
    return list_product_reviews(db, product_id)


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_product_review(
    product_id: int,
    payload: ReviewCreate,
    user: CurrentUser,
    db: DbSession,
) -> ReviewPublic:
    return create_review(db, product_id, user, payload)


@router.patch("/reviews/{review_id}", response_model=ReviewPublic)
def patch_review(
    review_id: int,
    payload: ReviewUpdate,
    user: CurrentUser,
    db: DbSession,
) -> ReviewPublic:
    review = require_review(db, review_id)
    return update_review(db, review, user, payload)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_review(review_id: int, user: CurrentUser, db: DbSession) -> None:
    review = require_review(db, review_id)
    is_admin = user.role == UserRole.admin
    delete_review(db, review, user, is_admin=is_admin)


@router.post("/reviews/upload", response_model=ReviewUploadResponse)
async def upload_review_image(
    user: CurrentUser,
    file: UploadFile = File(...),
) -> ReviewUploadResponse:
    image_url = await save_review_image(file)
    return ReviewUploadResponse(image_url=image_url)
