from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderLinePublic(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class OrderPublic(BaseModel):
    id: int
    invoice_number: str
    total_charged: Decimal
    balance_after: Decimal
    created_at: datetime
    lines: list[OrderLinePublic]

    model_config = {"from_attributes": True}
