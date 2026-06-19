from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)


class ReviewImageUrlRequest(BaseModel):
    image_url: str = Field(max_length=500)


class ReviewPublic(BaseModel):
    id: int
    product_id: int
    user_id: int
    username: str
    rating: int
    title: str
    body: str
    image_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
