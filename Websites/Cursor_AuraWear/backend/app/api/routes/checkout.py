from fastapi import APIRouter, HTTPException, Request

from app.api.deps import CurrentUser, DbSession
from app.models.system_event import EventCategory, EventSeverity
from app.schemas.checkout import CheckoutRequest, CheckoutResponse
from app.services.checkout import process_checkout
from app.services.events import log_event
from app.services.orders import create_order

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> CheckoutResponse:
    item_summary = [{"product_id": i.product_id, "quantity": i.quantity} for i in payload.items]
    try:
        total, line_items = process_checkout(db, user, payload)
    except HTTPException as exc:
        log_event(
            db,
            event_type="transaction.checkout.failure",
            category=EventCategory.transaction,
            message=f"Checkout failed for {user.username}: {exc.detail}",
            request=request,
            severity=EventSeverity.warning,
            success=False,
            user_id=user.id,
            actor_username=user.username,
            details={"items": item_summary, "reason": str(exc.detail)},
        )
        raise

    order = create_order(db, user, total, user.balance, line_items)

    log_event(
        db,
        event_type="transaction.checkout.success",
        category=EventCategory.transaction,
        message=f"Checkout completed for {user.username}: ${total:.2f}",
        request=request,
        user_id=user.id,
        actor_username=user.username,
        details={
            "order_id": order.id,
            "invoice_number": order.invoice_number,
            "total": str(total),
            "new_balance": str(user.balance),
            "items": [
                {
                    "product_id": li.product_id,
                    "name": li.name,
                    "quantity": li.quantity,
                    "line_total": str(li.line_total),
                }
                for li in line_items
            ],
        },
    )
    return CheckoutResponse(
        message="Order completed successfully",
        order_id=order.id,
        invoice_number=order.invoice_number,
        total=total,
        new_balance=user.balance,
        items=line_items,
    )
