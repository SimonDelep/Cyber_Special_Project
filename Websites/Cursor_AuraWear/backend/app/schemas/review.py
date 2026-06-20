from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    body: str = Field(min_length=10, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        trimmed = value.strip()
        if trimmed.startswith("/api/uploads/"):
            return trimmed
        HttpUrl(trimmed)
        return trimmed


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    title: str | None = Field(default=None, max_length=200)
    body: str | None = Field(default=None, min_length=10, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.strip():
            return None
        trimmed = value.strip()
        if trimmed.startswith("/api/uploads/"):
            return trimmed
        HttpUrl(trimmed)
        return trimmed


class ReviewAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    first_name: str | None


class ReviewPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    rating: int
    title: str | None
    body: str
    image_url: str | None
    author: ReviewAuthor
    created_at: datetime
    updated_at: datetime


class ReviewUploadResponse(BaseModel):
    image_url: str
