from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.system_event import EventCategory, EventSeverity


class SystemEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    category: EventCategory
    severity: EventSeverity
    success: bool
    user_id: int | None
    actor_username: str | None
    ip_address: str | None
    user_agent: str | None
    message: str
    details: dict[str, Any] | None
    created_at: datetime


class SystemEventListResponse(BaseModel):
    items: list[SystemEventPublic]
    total: int
    limit: int
    offset: int


class EventLogQuery(BaseModel):
    category: EventCategory | None = None
    event_type: str | None = Field(default=None, max_length=80)
    success: bool | None = None
    user_id: int | None = Field(default=None, ge=1)
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)
