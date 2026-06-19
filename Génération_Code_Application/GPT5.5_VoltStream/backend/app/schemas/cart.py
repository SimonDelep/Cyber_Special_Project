from pydantic import BaseModel, Field

from app.schemas.product import ProductRead


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=99, default=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartItemRead(BaseModel):
    product_id: int
    quantity: int
    product: ProductRead


class CartRead(BaseModel):
    items: list[CartItemRead]
    total_cents: int
    item_count: int
