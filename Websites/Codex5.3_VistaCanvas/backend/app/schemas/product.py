from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductPublic(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    category: str
    price: Decimal
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCatalogItem(ProductPublic):
    review_count: int = 0
    average_rating: float | None = None


class ProductDetail(ProductCatalogItem):
    pass


class ProductCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=80)
    price: Decimal = Field(gt=0)
    image_url: str | None = Field(default=None, max_length=500)


class ProductUpdate(BaseModel):
    slug: str | None = Field(default=None, max_length=120, pattern=r"^[a-z0-9-]+$")
    name: str | None = Field(default=None, max_length=200)
    description: str | None = None
    category: str | None = Field(default=None, max_length=80)
    price: Decimal | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)
