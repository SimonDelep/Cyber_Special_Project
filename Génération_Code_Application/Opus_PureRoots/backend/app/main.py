from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, auth, checkout, health, orders, products, reviews, users
from app.core.config import settings
from app.db.base import Base
from app.db.migrate import ensure_schema
from app.db.session import SessionLocal, engine
from app.seed import seed_admin, seed_products


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.avatars_dir.mkdir(parents=True, exist_ok=True)
    settings.reviews_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    ensure_schema(engine)
    db = SessionLocal()
    try:
        seed_products(db)
        seed_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PureRoots API",
    description="Sustainable e-commerce API for PureRoots",
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

api_prefix = settings.api_prefix.rstrip("/")
app.include_router(health.router, prefix=api_prefix)
app.include_router(products.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(checkout.router, prefix=api_prefix)
app.include_router(orders.router, prefix=api_prefix)
app.include_router(reviews.router, prefix=api_prefix)

app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir)), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "PureRoots API", "docs": "/docs"}
