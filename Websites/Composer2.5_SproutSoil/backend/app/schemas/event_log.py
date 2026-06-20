from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EventLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    action: str
    user_id: Optional[int]
    username: Optional[str]
    success: bool
    message: str
    details: Optional[str]
    created_at: datetime


class EventLogListResponse(BaseModel):
    total: int
    items: list[EventLogRead]
