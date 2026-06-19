from typing import Any

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.system_event import EventCategory, EventSeverity, SystemEvent


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def client_user_agent(request: Request) -> str | None:
    agent = request.headers.get("user-agent")
    if not agent:
        return None
    return agent[:500]


def log_event(
    db: Session,
    *,
    event_type: str,
    category: EventCategory,
    message: str,
    request: Request | None = None,
    severity: EventSeverity = EventSeverity.info,
    success: bool = True,
    user_id: int | None = None,
    actor_username: str | None = None,
    details: dict[str, Any] | None = None,
) -> SystemEvent:
    event = SystemEvent(
        event_type=event_type,
        category=category,
        severity=severity,
        success=success,
        user_id=user_id,
        actor_username=actor_username,
        ip_address=client_ip(request) if request else None,
        user_agent=client_user_agent(request) if request else None,
        message=message,
        details=details,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_events(
    db: Session,
    *,
    category: EventCategory | None = None,
    event_type: str | None = None,
    success: bool | None = None,
    user_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[SystemEvent], int]:
    query = select(SystemEvent)
    count_query = select(func.count()).select_from(SystemEvent)

    if category is not None:
        query = query.where(SystemEvent.category == category)
        count_query = count_query.where(SystemEvent.category == category)
    if event_type:
        query = query.where(SystemEvent.event_type == event_type)
        count_query = count_query.where(SystemEvent.event_type == event_type)
    if success is not None:
        query = query.where(SystemEvent.success.is_(success))
        count_query = count_query.where(SystemEvent.success.is_(success))
    if user_id is not None:
        query = query.where(SystemEvent.user_id == user_id)
        count_query = count_query.where(SystemEvent.user_id == user_id)

    total = db.scalar(count_query) or 0
    events = db.scalars(
        query.order_by(SystemEvent.created_at.desc(), SystemEvent.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(events), total
