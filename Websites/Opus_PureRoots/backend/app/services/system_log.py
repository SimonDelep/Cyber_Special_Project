import json
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.system_log import SystemLog
from app.models.user import User


def log_event(
    db: Session,
    event_type: str,
    *,
    message: str,
    success: bool = True,
    user: User | None = None,
    user_id: int | None = None,
    username: str | None = None,
    ip_address: str | None = None,
    details: dict[str, Any] | None = None,
) -> SystemLog:
    entry = SystemLog(
        event_type=event_type,
        user_id=user.id if user else user_id,
        username=(user.username if user else username),
        ip_address=ip_address,
        success=success,
        message=message[:500],
        details=json.dumps(details, default=str) if details else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_logs(
    db: Session,
    *,
    limit: int = 100,
    offset: int = 0,
    event_type: str | None = None,
    username: str | None = None,
    success: bool | None = None,
) -> tuple[list[SystemLog], int]:
    stmt = select(SystemLog)
    count_stmt = select(func.count()).select_from(SystemLog)

    if event_type:
        stmt = stmt.where(SystemLog.event_type == event_type)
        count_stmt = count_stmt.where(SystemLog.event_type == event_type)
    if username:
        stmt = stmt.where(SystemLog.username.ilike(f"%{username}%"))
        count_stmt = count_stmt.where(SystemLog.username.ilike(f"%{username}%"))
    if success is not None:
        stmt = stmt.where(SystemLog.success == success)
        count_stmt = count_stmt.where(SystemLog.success == success)

    total = db.scalar(count_stmt) or 0
    logs = list(
        db.scalars(
            stmt.order_by(SystemLog.created_at.desc()).limit(limit).offset(offset)
        )
    )
    return logs, total
