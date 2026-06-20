from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class OrderItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    total: Decimal
    balance_after: Decimal
    created_at: datetime
    items: list[OrderItemPublic]
