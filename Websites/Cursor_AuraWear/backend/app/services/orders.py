from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.checkout import CheckoutLineItem


def _invoice_number(order_id: int, created_at: datetime | None = None) -> str:
    when = created_at or datetime.now(UTC)
    return f"AW-{when.strftime('%Y%m%d')}-{order_id:06d}"


def create_order(
    db: Session,
    user: User,
    total: Decimal,
    balance_after: Decimal,
    line_items: list[CheckoutLineItem],
) -> Order:
    order = Order(
        user_id=user.id,
        invoice_number="PENDING",
        total=total,
        balance_after=balance_after,
    )
    db.add(order)
    db.flush()

    order.invoice_number = _invoice_number(order.id)
    for item in line_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                product_name=item.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Order | None:
    return db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(joinedload(Order.items), joinedload(Order.user))
    )


def require_order_for_user(db: Session, order_id: int, user_id: int) -> Order:
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return order
