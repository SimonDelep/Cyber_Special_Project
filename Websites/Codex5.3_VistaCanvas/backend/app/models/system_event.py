from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class EventType(str, enum.Enum):
    LOGIN_ATTEMPT = "login_attempt"
    LOGOUT = "logout"
    REGISTER = "register"
    PROFILE_UPDATE = "profile_update"
    PROFILE_AVATAR = "profile_avatar"
    ACCOUNT_DELETE = "account_delete"
    CHECKOUT_REQUEST = "checkout_request"
    ADMIN_USER_UPDATE = "admin_user_update"
    ADMIN_BALANCE_ADJUST = "admin_balance_adjust"


class EventStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    INFO = "info"


class SystemEvent(Base):
    __tablename__ = "system_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, name="event_type", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status", values_callable=lambda x: [e.value for e in x]),
        index=True,
    )
    message: Mapped[str] = mapped_column(String(500))
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    username: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )

    user: Mapped["User | None"] = relationship("User", back_populates="system_events")
