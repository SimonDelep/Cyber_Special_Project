import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.system_event import EventStatus, EventType, SystemEvent


def client_ip(request: Request | None) -> str | None:
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
    *,
    event_type: EventType,
    status: EventStatus,
    message: str,
    user_id: int | None = None,
    username: str | None = None,
    ip_address: str | None = None,
    metadata: dict[str, Any] | None = None,
    request: Request | None = None,
) -> SystemEvent:
    event = SystemEvent(
        event_type=event_type,
        status=status,
        message=message[:500],
        user_id=user_id,
        username=username,
        ip_address=ip_address or client_ip(request),
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def event_to_public(event: SystemEvent) -> dict[str, Any]:
    metadata = None
    if event.metadata_json:
        try:
            metadata = json.loads(event.metadata_json)
        except json.JSONDecodeError:
            metadata = {"raw": event.metadata_json}
    return {
        "id": event.id,
        "event_type": event.event_type,
        "status": event.status,
        "message": event.message,
        "user_id": event.user_id,
        "username": event.username,
        "ip_address": event.ip_address,
        "metadata": metadata,
        "created_at": event.created_at,
    }
