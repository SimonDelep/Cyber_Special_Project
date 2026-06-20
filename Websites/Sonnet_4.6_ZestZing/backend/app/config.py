from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", ROOT_DIR / ".env.example"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://zestzing:zestzing_secret@localhost:5434/zestzing"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"

    secret_key: str = "change-me-in-production-use-a-long-random-string"
    session_cookie_name: str = "zestzing_session"
    session_expire_days: int = 7
    uploads_dir: str = "uploads"
    max_avatar_size_mb: int = 5

    admin_username: str = "admin"
    admin_email: str = "admin@zestzing.com"
    admin_password: str = "admin123"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def uploads_path(self) -> Path:
        return ROOT_DIR / self.uploads_dir


settings = Settings()
