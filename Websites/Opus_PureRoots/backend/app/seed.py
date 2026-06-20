from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.product import Product
from app.models.user import User, UserRole

SEED_PRODUCTS = [
    {
        "name": "Bamboo Toothbrush — Soft",
        "slug": "bamboo-toothbrush-soft",
        "category": "oral-care",
        "description": "Biodegradable bamboo handle with plant-based bristles. Compost the handle after use.",
        "price": Decimal("6.99"),
        "image_url": "https://images.unsplash.com/photo-1607613009820-a38feaae6143?w=600&q=80",
    },
    {
        "name": "Bamboo Toothbrush — Family Pack (4)",
        "slug": "bamboo-toothbrush-family-pack",
        "category": "oral-care",
        "description": "Four soft bamboo toothbrushes in plastic-free packaging for the whole household.",
        "price": Decimal("22.99"),
        "image_url": "https://images.unsplash.com/photo-1628177142898-93e36e4de3bd?w=600&q=80",
    },
    {
        "name": "Cedar & Mint Shampoo Bar",
        "slug": "cedar-mint-shampoo-bar",
        "category": "personal-care",
        "description": "Concentrated zero-waste shampoo bar. Lasts up to 80 washes with no bottle waste.",
        "price": Decimal("14.50"),
        "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
    },
    {
        "name": "Lavender Oat Shampoo Bar",
        "slug": "lavender-oat-shampoo-bar",
        "category": "personal-care",
        "description": "Gentle oat and lavender formula for sensitive scalps. Fully recyclable paper wrap.",
        "price": Decimal("14.50"),
        "image_url": "https://images.unsplash.com/photo-1608248543779-3ae1d6ebc3f0?w=600&q=80",
    },
    {
        "name": "All-Purpose Cleaner — Refill",
        "slug": "all-purpose-cleaner-refill",
        "category": "household",
        "description": "Concentrated refill pouch for your existing spray bottle. Cuts single-use plastic by 90%.",
        "price": Decimal("9.99"),
        "image_url": "https://images.unsplash.com/photo-1583947215258-58774321a840?w=600&q=80",
    },
    {
        "name": "Glass Cleaner — Refill",
        "slug": "glass-cleaner-refill",
        "category": "household",
        "description": "Streak-free refill concentrate. Mix with water at home and reuse your bottle.",
        "price": Decimal("8.99"),
        "image_url": "https://images.unsplash.com/photo-1563453563898-566a73d771f4?w=600&q=80",
    },
]


def seed_products(db: Session) -> None:
    """Ensure the full catalog (6 products) exists; update images on existing rows."""
    for item in SEED_PRODUCTS:
        product = db.scalar(select(Product).where(Product.slug == item["slug"]))
        if product:
            product.name = item["name"]
            product.category = item["category"]
            product.description = item["description"]
            product.price = item["price"]
            product.image_url = item["image_url"]
        else:
            db.add(Product(**item))
    db.commit()


def seed_admin(db: Session) -> None:
    if db.scalar(select(User).where(User.username == "admin")):
        return

    from decimal import Decimal

    db.add(
        User(
            username="admin",
            email="admin@pureroots.local",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN,
            full_name="PureRoots Admin",
            balance=Decimal("500.00"),
        )
    )
    db.commit()
