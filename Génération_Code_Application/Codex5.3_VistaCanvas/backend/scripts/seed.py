"""Seed sample products for local development."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.services.catalog_seed import ensure_sample_products

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin12345"
ADMIN_EMAIL = "admin@vistacanvas.com"


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        seeded = []

        if ensure_sample_products(db):
            seeded.append("sample products")

        admin = db.query(User).filter(User.username == ADMIN_USERNAME).first()
        if not admin:
            db.add(
                User(
                    username=ADMIN_USERNAME,
                    email=ADMIN_EMAIL,
                    hashed_password=hash_password(ADMIN_PASSWORD),
                    role=UserRole.ADMIN,
                    full_name="VistaCanvas Admin",
                )
            )
            seeded.append("admin user")
        else:
            admin.hashed_password = hash_password(ADMIN_PASSWORD)
            admin.role = UserRole.ADMIN
            admin.email = ADMIN_EMAIL
            seeded.append("admin password refreshed")

        if seeded:
            db.commit()
            print(f"Seeded: {', '.join(seeded)}.")
        else:
            print("Database already seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
