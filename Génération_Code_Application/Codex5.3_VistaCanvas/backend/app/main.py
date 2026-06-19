from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, auth, checkout, health, inspiration, orders, products, profile
from app.config import settings
from app.database import SessionLocal, init_db
from app.services.catalog_seed import ensure_sample_products


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        ensure_sample_products(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="VistaCanvas API",
    description="Print-on-demand landscape wall art e-commerce API",
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
app.include_router(inspiration.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to VistaCanvas API"}
