from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.event_logger import CATEGORY_TRANSACTION, log_event
from app.database import get_db
from app.models import Product
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.checkout import (
    CheckoutLineItem,
    CheckoutRequest,
    CheckoutResponse,
)
from app.schemas.user import UserRead

router = APIRouter(prefix="/checkout", tags=["checkout"])


def _generate_invoice_number(db: Session) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"INV-{today}-"
    latest = (
        db.query(Order)
        .filter(Order.invoice_number.like(f"{prefix}%"))
        .order_by(Order.id.desc())
        .first()
    )
    if latest:
        seq = int(latest.invoice_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


@router.post("", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    line_items: list[CheckoutLineItem] = []
    total = Decimal("0")

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found",
            )

        unit_price = Decimal(str(product.price))
        line_total = unit_price * item.quantity
        total += line_total

        line_items.append(
            CheckoutLineItem(
                product_id=product.id,
                name=product.name,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    balance = Decimal(str(current_user.balance or 0))

    if balance < total:
        log_event(
            db,
            category=CATEGORY_TRANSACTION,
            action="checkout_failed",
            user=current_user,
            success=False,
            message=f"Checkout failed for '{current_user.username}': insufficient balance",
            details={
                "total": str(total),
                "balance": str(balance),
                "item_count": len(payload.items),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient balance. You have ${balance:.2f} but the order "
                f"total is ${total:.2f}. Please add funds or remove items."
            ),
        )

    current_user.balance = balance - total

    invoice_number = _generate_invoice_number(db)
    order = Order(
        invoice_number=invoice_number,
        user_id=current_user.id,
        total=total,
        balance_after=current_user.balance,
    )
    db.add(order)
    db.flush()

    for line in line_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=line.product_id,
                product_name=line.name,
                quantity=line.quantity,
                unit_price=line.unit_price,
                line_total=line.line_total,
            )
        )

    db.commit()
    db.refresh(current_user)

    log_event(
        db,
        category=CATEGORY_TRANSACTION,
        action="checkout",
        user=current_user,
        success=True,
        message=f"Checkout completed for '{current_user.username}' — ${total:.2f} charged",
        details={
            "invoice_number": invoice_number,
            "total": str(total),
            "new_balance": str(current_user.balance),
            "items": [
                {"product_id": i.product_id, "quantity": i.quantity}
                for i in payload.items
            ],
        },
    )

    return CheckoutResponse(
        message="Order placed successfully!",
        invoice_number=invoice_number,
        total=total,
        new_balance=Decimal(str(current_user.balance)),
        items=line_items,
        user=UserRead.model_validate(current_user),
    )
