from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product

CATALOG = [
    {
        "name": "Linen Midi Dress",
        "slug": "linen-midi-dress",
        "description": "Breathable linen blend with a relaxed fit — perfect for warm days and evenings out.",
        "price": Decimal("89.99"),
        "stock": 24,
        "category": "women",
        "image_url": "https://images.unsplash.com/photo-1595777458108-fa89d0532889?w=800&q=80",
    },
    {
        "name": "Oxford Cotton Shirt",
        "slug": "oxford-cotton-shirt",
        "description": "Crisp button-down in premium cotton. Dress it up or wear it casual.",
        "price": Decimal("64.50"),
        "stock": 40,
        "category": "men",
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2f?w=800&q=80",
    },
    {
        "name": "Merino Crew Sweater",
        "slug": "merino-crew-sweater",
        "description": "Soft merino wool layer that regulates temperature year-round.",
        "price": Decimal("119.00"),
        "stock": 18,
        "category": "men",
        "image_url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    },
    {
        "name": "High-Rise Wide Jeans",
        "slug": "high-rise-wide-jeans",
        "description": "Vintage-wash denim with a flattering high rise and wide leg.",
        "price": Decimal("98.00"),
        "stock": 30,
        "category": "women",
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3240?w=800&q=80",
    },
    {
        "name": "Leather Crossbody Bag",
        "slug": "leather-crossbody-bag",
        "description": "Compact everyday bag in vegetable-tanned leather with adjustable strap.",
        "price": Decimal("78.00"),
        "stock": 15,
        "category": "accessories",
        "image_url": "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    },
]


def seed_products(db: Session) -> None:
    for item in CATALOG:
        exists = db.scalar(select(Product).where(Product.slug == item["slug"]))
        if exists:
            continue
        db.add(Product(**item, is_active=True))

    db.commit()
