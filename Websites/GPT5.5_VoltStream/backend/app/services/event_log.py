from fastapi import Request

from app.database import SessionLocal
from app.models.system_log import SystemLog

# Auth
EVENT_LOGIN_SUCCESS = "auth.login.success"
EVENT_LOGIN_FAILURE = "auth.login.failure"
EVENT_REGISTER_SUCCESS = "auth.register.success"
EVENT_REGISTER_FAILURE = "auth.register.failure"

# Profile
EVENT_PROFILE_UPDATE = "profile.update"

# Transactions
EVENT_CHECKOUT_SUCCESS = "transaction.checkout.success"
EVENT_CHECKOUT_FAILURE = "transaction.checkout.failure"


def client_ip(request: Request | None) -> str | None:
    if not request:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def log_event(
    *,
    event_type: str,
    message: str,
    success: bool = True,
    severity: str | None = None,
    actor_user_id: int | None = None,
    actor_email: str | None = None,
    target_user_id: int | None = None,
    ip_address: str | None = None,
    details: dict | None = None,
) -> None:
    if severity is None:
        if not success:
            severity = "error"
        elif event_type.endswith(".failure"):
            severity = "warning"
        else:
            severity = "info"

    db = SessionLocal()
    try:
        db.add(
            SystemLog(
                event_type=event_type,
                severity=severity,
                message=message,
                success=success,
                actor_user_id=actor_user_id,
                actor_email=actor_email,
                target_user_id=target_user_id,
                ip_address=ip_address,
                details=details,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
