import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.event_log import EventLog, EventStatus, EventType


def get_client_ip(request: Request | None) -> str | None:
    if request is None:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def log_event(
    db: Session,
    event_type: EventType,
    status: EventStatus,
    message: str,
    *,
    user_id: int | None = None,
    username: str | None = None,
    ip_address: str | None = None,
    details: dict[str, Any] | None = None,
) -> EventLog:
    entry = EventLog(
        event_type=event_type,
        status=status,
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        message=message[:500],
        details=json.dumps(details) if details else None,
    )
    db.add(entry)
    db.commit()
    return entry
