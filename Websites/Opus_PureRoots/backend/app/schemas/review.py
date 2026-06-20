from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    username: str
    rating: int
    comment: str
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime


class ReviewCreateJson(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=3000)
    image_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "" and not v.startswith(("http://", "https://", "/uploads/")):
            raise ValueError("Image URL must start with http://, https://, or /uploads/")
        return v or None
