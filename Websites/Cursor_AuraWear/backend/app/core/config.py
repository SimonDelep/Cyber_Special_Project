from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://aurawear:aurawear@localhost:5432/aurawear"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    session_cookie_name: str = "aurawear_session"
    session_expire_days: int = 7
    admin_username: str | None = None
    admin_password: str | None = None
    admin_email: str = "admin@aurawear.com"
    upload_dir: str = "uploads"

    @property
    def upload_dir_path(self) -> Path:
        base = Path(__file__).resolve().parent.parent.parent
        return base / self.upload_dir

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
