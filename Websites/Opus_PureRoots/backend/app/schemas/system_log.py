from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SystemLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    user_id: Optional[int]
    username: Optional[str]
    ip_address: Optional[str]
    success: bool
    message: str
    details: Optional[str]
    created_at: datetime


class SystemLogListResponse(BaseModel):
    items: list[SystemLogRead]
    total: int
    limit: int
    offset: int
