import json
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.event_log import EventStatus, EventType
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.checkout import CheckoutLineItem, CheckoutRequest, CheckoutResponse
from app.services.event_log import get_client_ip, log_event

router = APIRouter(prefix="/checkout", tags=["checkout"])


def _invoice_number(order_id: int) -> str:
    year = datetime.now(timezone.utc).year
    return f"ZZ-{year}-{order_id:06d}"


@router.post("", response_model=CheckoutResponse)
def simulate_checkout(
    body: CheckoutRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ip = get_client_ip(request)
    line_items: list[CheckoutLineItem] = []
    total = Decimal("0.00")

    seen_ids: set[int] = set()
    for item in body.items:
        if item.product_id in seen_ids:
            raise HTTPException(status_code=400, detail="Duplicate product in cart")
        seen_ids.add(item.product_id)

        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found",
            )

        line_total = product.price * item.quantity
        total += line_total
        line_items.append(
            CheckoutLineItem(
                product_id=product.id,
                name=product.name,
                quantity=item.quantity,
                unit_price=product.price,
                line_total=line_total,
            )
        )

    previous_balance = current_user.balance
    if previous_balance < total:
        shortfall = total - previous_balance
        log_event(
            db,
            EventType.CHECKOUT_FAILURE,
            EventStatus.FAILURE,
            f"Checkout declined: insufficient balance (${previous_balance:.2f} < ${total:.2f})",
            user_id=current_user.id,
            username=current_user.username,
            ip_address=ip,
            details={
                "total": str(total),
                "balance": str(previous_balance),
                "shortfall": str(shortfall),
                "item_count": len(line_items),
            },
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient balance. Your balance is ${previous_balance:.2f}, "
                f"but the order total is ${total:.2f}. "
                f"You need ${shortfall:.2f} more."
            ),
        )

    current_user.balance = previous_balance - total

    items_json = json.dumps([item.model_dump(mode="json") for item in line_items])
    order = Order(
        invoice_number="PENDING",
        user_id=current_user.id,
        total=total,
        previous_balance=previous_balance,
        new_balance=current_user.balance,
        line_items_json=items_json,
    )
    db.add(order)
    db.flush()
    order.invoice_number = _invoice_number(order.id)

    db.commit()
    db.refresh(current_user)
    db.refresh(order)

    log_event(
        db,
        EventType.CHECKOUT_SUCCESS,
        EventStatus.SUCCESS,
        f"Checkout completed: ${total:.2f} charged to {current_user.username}",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=ip,
        details={
            "total": str(total),
            "previous_balance": str(previous_balance),
            "new_balance": str(current_user.balance),
            "invoice_id": order.id,
            "invoice_number": order.invoice_number,
            "items": [
                {"product_id": i.product_id, "name": i.name, "quantity": i.quantity}
                for i in line_items
            ],
        },
    )

    return CheckoutResponse(
        total=total,
        previous_balance=previous_balance,
        new_balance=current_user.balance,
        items=line_items,
        invoice_id=order.id,
        invoice_number=order.invoice_number,
    )
