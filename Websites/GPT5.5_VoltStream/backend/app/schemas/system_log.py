from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class SystemLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    severity: str
    message: str
    success: bool
    actor_user_id: Optional[int] = None
    actor_email: Optional[str] = None
    target_user_id: Optional[int] = None
    ip_address: Optional[str] = None
    details: Optional[dict[str, Any]] = None
    created_at: datetime


class SystemLogListResponse(BaseModel):
    items: list[SystemLogRead]
    total: int
    limit: int
    offset: int
