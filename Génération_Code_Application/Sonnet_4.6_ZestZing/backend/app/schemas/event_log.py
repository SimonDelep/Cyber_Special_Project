import json
from datetime import datetime

from pydantic import BaseModel

from app.models.event_log import EventStatus, EventType


class EventLogPublic(BaseModel):
    id: int
    event_type: EventType
    status: EventStatus
    user_id: int | None
    username: str | None
    ip_address: str | None
    message: str
    details: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, log) -> "EventLogPublic":
        details = None
        if log.details:
            try:
                details = json.loads(log.details)
            except json.JSONDecodeError:
                details = {"raw": log.details}
        return cls(
            id=log.id,
            event_type=log.event_type,
            status=log.status,
            user_id=log.user_id,
            username=log.username,
            ip_address=log.ip_address,
            message=log.message,
            details=details,
            created_at=log.created_at,
        )
