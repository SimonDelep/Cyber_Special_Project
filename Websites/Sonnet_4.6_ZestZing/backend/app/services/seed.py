from decimal import Decimal

from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import hash_password
from app.models.product import Product, ProductCategory
from app.models.user import User, UserRole

SEED_PRODUCTS = [
    {
        "name": "Ember Ghost Habanero",
        "slug": "ember-ghost-habanero",
        "description": "Small-batch habanero sauce with roasted garlic and a slow-building citrus finish. Heat level: bold.",
        "category": ProductCategory.HOT_SAUCE,
        "price": Decimal("18.99"),
        "image_url": "https://images.unsplash.com/photo-1598027613295-56c150c45a72?w=600&auto=format&fit=crop",
    },
    {
        "name": "Smoky Chipotle Reserve",
        "slug": "smoky-chipotle-reserve",
        "description": "Chipotle and ancho peppers smoked over mesquite, balanced with a touch of maple. Perfect on eggs and tacos.",
        "category": ProductCategory.HOT_SAUCE,
        "price": Decimal("16.50"),
        "image_url": "https://images.unsplash.com/photo-1532339140508-159d2460d667?w=600&auto=format&fit=crop",
    },
    {
        "name": "Black Truffle Drizzle Oil",
        "slug": "black-truffle-drizzle-oil",
        "description": "Cold-pressed extra virgin olive oil infused with black truffle. A few drops transform pasta, risotto, and fries.",
        "category": ProductCategory.TRUFFLE_OIL,
        "price": Decimal("34.00"),
        "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop",
    },
    {
        "name": "Gold Leaf Garlic Truffle Oil",
        "slug": "gold-leaf-garlic-truffle-oil",
        "description": "White truffle notes meet slow-roasted garlic in a delicate oil made for finishing, not frying.",
        "category": ProductCategory.TRUFFLE_OIL,
        "price": Decimal("29.50"),
        "image_url": "https://images.unsplash.com/photo-1609501676725-7186abf33e1c?w=600&auto=format&fit=crop",
    },
    {
        "name": "Midnight Espresso Rub",
        "slug": "midnight-espresso-rub",
        "description": "Hand-ground blend of espresso, cocoa, smoked paprika, and brown sugar — built for steaks and short ribs.",
        "category": ProductCategory.SPICE_BLEND,
        "price": Decimal("14.00"),
        "image_url": "https://images.unsplash.com/photo-1506368249639-55a054b48ffb?w=600&auto=format&fit=crop",
    },
    {
        "name": "Citrus Fire Finishing Salt",
        "slug": "citrus-fire-finishing-salt",
        "description": "Flor de sel with dried lime, aleppo pepper, and coriander. Sprinkle on seafood, avocado, and grilled vegetables.",
        "category": ProductCategory.SPICE_BLEND,
        "price": Decimal("12.50"),
        "image_url": "https://images.unsplash.com/photo-1509440156396-0249088772ff?w=600&auto=format&fit=crop",
    },
]


def seed_admin_user(db: Session) -> None:
    existing = db.query(User).filter(User.username == settings.admin_username).first()
    if existing:
        return

    admin = User(
        username=settings.admin_username,
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        role=UserRole.ADMIN,
        first_name="Admin",
        last_name="ZestZing",
    )
    db.add(admin)
    db.commit()


def seed_products(db: Session) -> None:
    if db.query(Product).count() >= 5:
        return

    for item in SEED_PRODUCTS:
        if db.query(Product).filter(Product.slug == item["slug"]).first():
            continue
        db.add(Product(**item))
    db.commit()
