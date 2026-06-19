from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import inspect, text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models import Order, OrderItem, Product, Review, User, UserRole
from app.models.event_log import EventLog
from app.routers import admin, auth, checkout, external, health, invoices, logs, products, reviews, users


def seed_products():
    seed_data = [
        {
            "name": "Smart Herb Garden Kit",
            "slug": "smart-herb-garden-kit",
            "description": "Grow basil, mint, and thyme year-round with built-in LED grow lights and app-controlled watering.",
            "price": 89.99,
            "category": "herb-garden-kits",
            "image_url": "https://images.unsplash.com/photo-1466692476869-aef1dfb1e735?w=600&h=400&fit=crop",
        },
        {
            "name": "Compact Desktop Garden",
            "slug": "compact-desktop-garden",
            "description": "Space-saving smart garden for kitchen counters — perfect for parsley, chives, and microgreens.",
            "price": 64.99,
            "category": "herb-garden-kits",
            "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
        },
        {
            "name": "Self-Watering Ceramic Planter",
            "slug": "self-watering-ceramic-planter",
            "description": "Handcrafted ceramic planter with a hidden reservoir that keeps herbs hydrated for up to two weeks.",
            "price": 54.99,
            "category": "planters",
            "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d826?w=600&h=400&fit=crop",
        },
        {
            "name": "Premium Terracotta Planter Set",
            "slug": "premium-terracotta-planter-set",
            "description": "Set of three breathable terracotta pots with matching saucers — ideal for rosemary, sage, and oregano.",
            "price": 42.99,
            "category": "planters",
            "image_url": "https://images.unsplash.com/photo-1592150621744-aca64f483902?w=600&h=400&fit=crop",
        },
        {
            "name": "Plant Nutrient Mist — Herb Blend",
            "slug": "plant-nutrient-mist-herb-blend",
            "description": "Fine-mist formula enriched with micronutrients tailored for indoor culinary herbs.",
            "price": 18.99,
            "category": "nutrient-mists",
            "image_url": "https://images.unsplash.com/photo-1628556270448-7c3ef53b3c2f?w=600&h=400&fit=crop",
        },
        {
            "name": "Plant Nutrient Mist — Citrus & Mint",
            "slug": "plant-nutrient-mist-citrus-mint",
            "description": "Brightening mist blend for lemon balm, mint, and other aromatic indoor herbs.",
            "price": 19.99,
            "category": "nutrient-mists",
            "image_url": "https://images.unsplash.com/photo-1530836368580-856a9d333be8?w=600&h=400&fit=crop",
        },
    ]

    db = SessionLocal()
    try:
        existing_slugs = {row[0] for row in db.query(Product.slug).all()}
        changed = False
        for item in seed_data:
            if item["slug"] not in existing_slugs:
                db.add(Product(**item))
                changed = True
            else:
                product = db.query(Product).filter(Product.slug == item["slug"]).first()
                if product and not product.image_url and item.get("image_url"):
                    product.image_url = item["image_url"]
                    changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def seed_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == settings.admin_username).first()
        if not admin:
            db.add(
                User(
                    username=settings.admin_username,
                    email="admin@sproutsoil.local",
                    full_name="SproutSoil Admin",
                    password_hash=hash_password(settings.admin_password),
                    role=UserRole.ADMIN,
                )
            )
            db.commit()
    finally:
        db.close()


def run_migrations():
    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    if "users" in insp.get_table_names():
        columns = {c["name"] for c in insp.get_columns("users")}
        if "balance" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE users ADD COLUMN balance NUMERIC(12,2) NOT NULL DEFAULT 0"
                    )
                )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    (settings.upload_dir / "avatars").mkdir(parents=True, exist_ok=True)
    (settings.upload_dir / "reviews").mkdir(parents=True, exist_ok=True)
    run_migrations()
    seed_products()
    seed_admin()
    yield


app = FastAPI(
    title="SproutSoil API",
    description="E-commerce API for smart indoor gardening products",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
(settings.upload_dir / "avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")

app.include_router(health.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(external.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
