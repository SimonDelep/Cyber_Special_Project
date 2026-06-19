from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://pureroots:pureroots@localhost:5432/pureroots"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    session_expire_days: int = 7
    session_cookie_name: str = "pureroots_session"
    upload_dir: Path = BACKEND_ROOT / "uploads"
    max_avatar_size_mb: int = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def avatars_dir(self) -> Path:
        return self.upload_dir / "avatars"

    @property
    def reviews_dir(self) -> Path:
        return self.upload_dir / "reviews"


settings = Settings()
