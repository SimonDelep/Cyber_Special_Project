from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=200)
    content: str = Field(min_length=10, max_length=2000)
    image_url: Optional[str] = Field(default=None, max_length=500)


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=200)
    content: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    image_url: Optional[str] = Field(default=None, max_length=500)


class ReviewImageUrlUpdate(BaseModel):
    image_url: str = Field(max_length=500)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    username: str
    user_avatar: Optional[str]
    rating: int
    title: Optional[str]
    content: str
    image_url: Optional[str]
    created_at: datetime
