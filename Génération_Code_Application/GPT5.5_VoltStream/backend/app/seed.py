from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password
from app.database import SessionLocal, engine
from app.models.product import Product
from app.models.user import User

SAMPLE_PRODUCTS = [
    {
        "name": "GridStrike Pro TKL",
        "description": "Low-profile mechanical switches with split ergonomic angle and wrist rest.",
        "category": "keyboard",
        "price_cents": 18999,
        "image_url": "/products/keyboard.svg",
    },
    {
        "name": "ApexFlow 75%",
        "description": "Hot-swappable switches, gasket mount, and per-key RGB for marathon sessions.",
        "category": "keyboard",
        "price_cents": 15999,
        "image_url": "/products/keyboard.svg",
    },
    {
        "name": "ErgoSplit Pro",
        "description": "Split ergonomic layout reduces wrist strain — ideal for coders and MMO grinders.",
        "category": "keyboard",
        "price_cents": 22999,
        "image_url": "/products/keyboard.svg",
    },
    {
        "name": "PrecisionX Ultra",
        "description": "26K DPI sensor, 63g shell, and PTFE feet tuned for competitive FPS.",
        "category": "mouse",
        "price_cents": 8999,
        "image_url": "/products/mouse.svg",
    },
    {
        "name": "ClutchGrip Wireless",
        "description": "Ergonomic right-hand shape with 80-hour battery and sub-1ms wireless.",
        "category": "mouse",
        "price_cents": 10999,
        "image_url": "/products/mouse.svg",
    },
    {
        "name": "SwiftTrack Mini",
        "description": "Compact ambidextrous design with 19K DPI — perfect for claw and fingertip grips.",
        "category": "mouse",
        "price_cents": 6999,
        "image_url": "/products/mouse.svg",
    },
    {
        "name": "NeonGrid XL Desk Mat",
        "description": "900×400mm surface with edge-to-edge RGB and spill-resistant coating.",
        "category": "desk_mat",
        "price_cents": 4999,
        "image_url": "/products/desk_mat.svg",
    },
    {
        "name": "PulseWave RGB Mat",
        "description": "Customizable light zones synced via desktop app — match your setup.",
        "category": "desk_mat",
        "price_cents": 5999,
        "image_url": "/products/desk_mat.svg",
    },
]


def ensure_user_schema() -> None:
    """Add columns to existing databases created before admin/balance support."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("users")}
    with engine.begin() as conn:
        if "is_admin" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
        if "balance_cents" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN balance_cents BIGINT NOT NULL DEFAULT 0"))


def seed_products() -> None:
    """Ensure catalog has at least five products; add missing items and backfill images."""
    db: Session = SessionLocal()
    try:
        by_name = {p.name: p for p in db.query(Product).all()}
        changed = False
        for item in SAMPLE_PRODUCTS:
            existing = by_name.get(item["name"])
            if existing:
                if not existing.image_url and item.get("image_url"):
                    existing.image_url = item["image_url"]
                    changed = True
            else:
                db.add(Product(**item))
                changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def seed_admin() -> None:
    if not settings.admin_email or not settings.admin_password:
        return
    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.admin_email).first()
        if admin:
            if not admin.is_admin:
                admin.is_admin = True
                db.commit()
            return
        db.add(
            User(
                email=settings.admin_email,
                full_name=settings.admin_full_name,
                hashed_password=hash_password(settings.admin_password),
                is_admin=True,
            )
        )
        db.commit()
    finally:
        db.close()
