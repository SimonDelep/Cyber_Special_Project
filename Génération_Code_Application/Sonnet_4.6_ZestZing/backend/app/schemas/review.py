from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=2000)
    image_url: str | None = Field(default=None, max_length=500)


class ReviewImageUrlRequest(BaseModel):
    image_url: str = Field(max_length=500)


class ReviewPublic(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: int
    comment: str
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
