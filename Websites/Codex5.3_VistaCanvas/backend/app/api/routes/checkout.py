from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.order import Order, OrderLine
from app.models.product import Product
from app.models.system_event import EventStatus, EventType
from app.models.user import User
from app.schemas.checkout import (
    CheckoutLineResult,
    CheckoutRequest,
    CheckoutResponse,
)
from app.services.event_log import log_event

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutResponse)
def simulate_checkout(
    payload: CheckoutRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CheckoutResponse:
    product_ids = [line.product_id for line in payload.items]
    item_count = sum(line.quantity for line in payload.items)

    log_event(
        db,
        event_type=EventType.CHECKOUT_REQUEST,
        status=EventStatus.INFO,
        message=f"Checkout requested by {user.username} ({item_count} items)",
        user_id=user.id,
        username=user.username,
        metadata={
            "product_ids": product_ids,
            "line_count": len(payload.items),
            "item_count": item_count,
        },
        request=request,
    )

    if len(product_ids) != len(set(product_ids)):
        log_event(
            db,
            event_type=EventType.CHECKOUT_REQUEST,
            status=EventStatus.FAILURE,
            message=f"Checkout failed for {user.username}: duplicate products",
            user_id=user.id,
            username=user.username,
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate product entries in cart",
        )

    products = {
        p.id: p
        for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
    }
    missing = [pid for pid in product_ids if pid not in products]
    if missing:
        log_event(
            db,
            event_type=EventType.CHECKOUT_REQUEST,
            status=EventStatus.FAILURE,
            message=f"Checkout failed for {user.username}: products not found",
            user_id=user.id,
            username=user.username,
            metadata={"missing_product_ids": missing},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product(s) not found: {', '.join(str(m) for m in missing)}",
        )

    line_results: list[CheckoutLineResult] = []
    total = Decimal("0.00")

    for line in payload.items:
        product = products[line.product_id]
        unit_price = Decimal(str(product.price))
        line_total = unit_price * line.quantity
        total += line_total
        line_results.append(
            CheckoutLineResult(
                product_id=product.id,
                name=product.name,
                quantity=line.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    balance = Decimal(str(user.balance))
    if balance < total:
        log_event(
            db,
            event_type=EventType.CHECKOUT_REQUEST,
            status=EventStatus.FAILURE,
            message=f"Checkout failed for {user.username}: insufficient balance",
            user_id=user.id,
            username=user.username,
            metadata={
                "balance": str(balance),
                "order_total": str(total),
                "shortfall": str(total - balance),
            },
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient balance. You have ${balance:.2f} but the order "
                f"total is ${total:.2f}."
            ),
        )

    user.balance = balance - total

    order = Order(
        invoice_number="PENDING",
        user_id=user.id,
        total_charged=total,
        balance_after=user.balance,
    )
    db.add(order)
    db.flush()

    year = datetime.now(timezone.utc).year
    order.invoice_number = f"VC-{year}-{order.id:06d}"

    for line in payload.items:
        product = products[line.product_id]
        unit_price = Decimal(str(product.price))
        db.add(
            OrderLine(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=line.quantity,
                unit_price=unit_price,
                line_total=unit_price * line.quantity,
            )
        )

    db.commit()
    db.refresh(user)
    db.refresh(order)

    log_event(
        db,
        event_type=EventType.CHECKOUT_REQUEST,
        status=EventStatus.SUCCESS,
        message=f"Checkout completed for {user.username}: ${total:.2f}",
        user_id=user.id,
        username=user.username,
        metadata={
            "order_id": order.id,
            "invoice_number": order.invoice_number,
            "total_charged": str(total),
            "new_balance": str(user.balance),
            "item_count": item_count,
        },
        request=request,
    )

    return CheckoutResponse(
        message="Checkout completed successfully.",
        order_id=order.id,
        invoice_number=order.invoice_number,
        total_charged=total,
        balance=Decimal(str(user.balance)),
        items=line_results,
    )
