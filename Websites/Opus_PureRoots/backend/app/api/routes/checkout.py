from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import CurrentUser, DbSession
from app.core.request_utils import get_client_ip
from app.models.system_log import EventType
from app.schemas.checkout import CheckoutRequest, CheckoutResponse
from app.services.checkout import CheckoutError, InsufficientBalanceError, process_checkout
from app.services.system_log import log_event

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("", response_model=CheckoutResponse)
def checkout(
    body: CheckoutRequest,
    request: Request,
    user: CurrentUser,
    db: DbSession,
) -> CheckoutResponse:
    ip = get_client_ip(request)
    item_summary = [{"product_id": i.product_id, "quantity": i.quantity} for i in body.items]

    try:
        result = process_checkout(db, user, body.items)
        log_event(
            db,
            EventType.CHECKOUT_SUCCESS.value,
            message=f"Checkout completed — order #{result.order_id} (${result.total})",
            user=user,
            ip_address=ip,
            success=True,
            details={
                "order_id": result.order_id,
                "total": str(result.total),
                "new_balance": str(result.new_balance),
                "items": item_summary,
            },
        )
        return result
    except InsufficientBalanceError as e:
        log_event(
            db,
            EventType.CHECKOUT_FAILURE.value,
            message=f"Checkout failed — insufficient balance for {user.username}",
            user=user,
            ip_address=ip,
            success=False,
            details={
                "error": str(e),
                "balance": str(e.balance),
                "total": str(e.total),
                "items": item_summary,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(e),
        ) from e
    except CheckoutError as e:
        log_event(
            db,
            EventType.CHECKOUT_FAILURE.value,
            message=f"Checkout failed for {user.username}",
            user=user,
            ip_address=ip,
            success=False,
            details={"error": str(e), "items": item_summary},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
