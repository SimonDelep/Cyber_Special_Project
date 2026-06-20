from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql+psycopg://sproutsoil:sproutsoil@localhost:5432/sproutsoil"
    cors_origins: str = "http://localhost:5173"
    session_expire_hours: int = 168
    admin_username: str = "admin"
    admin_password: str = "admin12345"
    upload_dir: Path = BASE_DIR / "uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
