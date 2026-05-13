from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    TEST_DATABASE_URL: str

    API_PREFIX: str
    PROJECT_NAME: str
    PROJECT_VERSION: str
    PROJECT_DESCRIPTION: str
    ALLOWED_ORIGINS: list[str]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        raise TypeError("ALLOWED_ORIGINS must be a comma-separated string or a list")

    @model_validator(mode="after")
    def normalize_sqlite_urls(self) -> "Settings":
        self.DATABASE_URL = self._normalize_sqlite_url(self.DATABASE_URL)
        self.TEST_DATABASE_URL = self._normalize_sqlite_url(self.TEST_DATABASE_URL)
        return self

    @staticmethod
    def _normalize_sqlite_url(url: str) -> str:
        prefix = "sqlite+aiosqlite:///"
        if not url.startswith(prefix):
            return url

        sqlite_path = url.removeprefix(prefix)
        if sqlite_path == ":memory:":
            return url

        path = Path(sqlite_path)
        if path.is_absolute():
            return url

        return f"{prefix}{(BASE_DIR / path).resolve().as_posix()}"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
