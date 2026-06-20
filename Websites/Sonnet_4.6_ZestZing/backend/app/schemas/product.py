from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.product import ProductCategory


class ProductPublic(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    category: ProductCategory
    price: Decimal
    image_url: str | None

    model_config = {"from_attributes": True}


class ProductAdmin(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    category: ProductCategory
    price: Decimal
    image_url: str | None

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = ""
    category: ProductCategory
    price: Decimal = Field(gt=0, decimal_places=2)
    image_url: str | None = Field(default=None, max_length=500)


class ProductImportRowError(BaseModel):
    row: int
    error: str


class ProductImportResult(BaseModel):
    created: int
    failed: int
    errors: list[ProductImportRowError]


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    category: ProductCategory | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    image_url: str | None = Field(default=None, max_length=500)
