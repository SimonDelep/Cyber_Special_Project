from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.system_event import EventStatus, EventType


class SystemEventPublic(BaseModel):
    id: int
    event_type: EventType
    status: EventStatus
    message: str
    user_id: int | None
    username: str | None
    ip_address: str | None
    metadata: dict[str, Any] | None = None
    created_at: datetime


class SystemEventListParams(BaseModel):
    limit: int = Field(default=100, ge=1, le=500)
    event_type: EventType | None = None
    status: EventStatus | None = None
    user_id: int | None = None
