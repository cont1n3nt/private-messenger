from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///private_messenger.db"
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///:memory:"

    API_PREFIX: str = "/api/v0"
    PROJECT_NAME: str = "Private Messenger"
    PROJECT_VERSION: str = "0.0.0"
    PROJECT_DESCRIPTION: str = "A messenger with powerful encryption."
    
    model_config = SettingsConfigDict( # в версии pydantic v3 будет удалена поддержка конфига на основе класса (aka class Config, поэтому заменил на обновленный SettingsConfigDict
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8"
    )

settings = Settings()