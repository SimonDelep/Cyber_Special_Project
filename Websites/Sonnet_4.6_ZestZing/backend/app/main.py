from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import admin, auth, checkout, health, invoices, products, quotes, reviews, users
from app.config import settings
from app.database import init_db
from app.services.images import get_uploads_path

get_uploads_path()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="ZestZing API",
    description="E-commerce API for gourmet hot sauces, truffle oils, and spice blends",
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

app.mount("/uploads", StaticFiles(directory=str(settings.uploads_path)), name="uploads")

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Welcome to ZestZing API"}
