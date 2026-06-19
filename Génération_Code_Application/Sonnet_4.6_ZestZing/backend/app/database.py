from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import event_log, order, product, review, user  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _run_migrations()

    db = SessionLocal()
    try:
        from app.services.seed import seed_admin_user, seed_products

        seed_admin_user(db)
        seed_products(db)
    finally:
        db.close()


def _run_migrations() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC(10, 2) "
                "NOT NULL DEFAULT 0.00"
            )
        )
        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_enum e
                        JOIN pg_type t ON e.enumtypid = t.oid
                        WHERE t.typname = 'event_type'
                          AND e.enumlabel = 'ADMIN_PRODUCT_IMPORT'
                    ) THEN
                        ALTER TYPE event_type ADD VALUE 'ADMIN_PRODUCT_IMPORT';
                    END IF;
                END$$;
                """
            )
        )
        conn.commit()
