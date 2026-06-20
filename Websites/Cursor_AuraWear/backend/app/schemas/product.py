from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    price: Decimal = Field(gt=0, decimal_places=2, max_digits=10)
    stock: int = Field(ge=0, default=0)
    category: str = Field(min_length=1, max_length=100, default="general")
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2, max_digits=10)
    stock: int | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    stock: int
    category: str
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
