from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.event_log import EventLog
from app.models.user import User
from app.schemas.event_log import EventLogListResponse, EventLogRead

router = APIRouter(prefix="/admin/logs", tags=["admin-logs"])


@router.get("", response_model=EventLogListResponse)
def list_event_logs(
    category: str | None = Query(default=None, max_length=50),
    action: str | None = Query(default=None, max_length=80),
    success: bool | None = Query(default=None),
    username: str | None = Query(default=None, max_length=50),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(EventLog)

    if category:
        query = query.filter(EventLog.category == category)
    if action:
        query = query.filter(EventLog.action == action)
    if success is not None:
        query = query.filter(EventLog.success == success)
    if username:
        query = query.filter(EventLog.username.ilike(f"%{username}%"))

    total = query.count()
    logs = (
        query.order_by(EventLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return EventLogListResponse(
        total=total,
        items=[EventLogRead.model_validate(log) for log in logs],
    )
