from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import admin, auth, cart, checkout, health, products, quote, reviews
from app.config import settings
from app.database import Base, engine
from app.models import CartItem, Order, OrderItem, Product, Review, SystemLog, User  # noqa: F401 — register models
from app.seed import ensure_user_schema, seed_admin, seed_products


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_user_schema()
    seed_products()
    seed_admin()
    yield


app = FastAPI(
    title="GamerGrid API",
    description="E-commerce API for ergonomic keyboards, gaming mice, and RGB desk mats.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(quote.router, prefix="/api")

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads/reviews", StaticFiles(directory=str(upload_path)), name="review-uploads")
