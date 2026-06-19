import json
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.event_log import EventLog
from app.models.user import User

logger = logging.getLogger(__name__)

CATEGORY_AUTH = "auth"
CATEGORY_PROFILE = "profile"
CATEGORY_TRANSACTION = "transaction"
CATEGORY_ADMIN = "admin"


def log_event(
    db: Session,
    *,
    category: str,
    action: str,
    message: str,
    success: bool = True,
    user: Optional[User] = None,
    username: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    try:
        entry = EventLog(
            category=category,
            action=action,
            user_id=user.id if user else None,
            username=username or (user.username if user else None),
            success=success,
            message=message[:500],
            details=json.dumps(details) if details else None,
        )
        db.add(entry)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to write event log: %s/%s", category, action)
