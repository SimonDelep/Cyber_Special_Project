from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, auth, checkout, health, orders, products, reviews, users
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.seed_products import seed_products
from app.core.startup import init_db, seed_admin
from app.services.uploads import ensure_upload_dir


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    ensure_upload_dir()
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_products(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AuraWear API",
    description="E-commerce API for AuraWear clothing",
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

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(orders.router, prefix="/api")

ensure_upload_dir()
app.mount(
    "/api/uploads",
    StaticFiles(directory=str(settings.upload_dir_path)),
    name="uploads",
)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to AuraWear API"}
