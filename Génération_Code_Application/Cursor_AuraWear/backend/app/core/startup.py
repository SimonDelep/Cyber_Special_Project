from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import engine
from app.core.security import hash_password
from app.models import Base, User, UserRole
from app.services.auth import get_user_by_username
from sqlalchemy.orm import Session


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    migrate_schema()


def migrate_schema() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00"
            )
        )
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)")
        )


def seed_admin(db: Session) -> None:
    if not settings.admin_username or not settings.admin_password:
        return
    username = settings.admin_username.lower()
    if get_user_by_username(db, username):
        return
    admin = User(
        username=username,
        email=settings.admin_email.lower(),
        password_hash=hash_password(settings.admin_password),
        role=UserRole.admin,
        first_name="Admin",
    )
    db.add(admin)
    db.commit()
