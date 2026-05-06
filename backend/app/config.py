from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///private_messenger.db"
<<<<<<< HEAD
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///:memory:"
=======
    TEST_DATABASE_URL: str = "sqlite+aiosqlite:///test_messenger.db"
>>>>>>> e820f28 (fix: /ws, /messages, config.py)

    API_PREFIX: str = "/api/v0"
    PROJECT_NAME: str = "Private Messenger"
    PROJECT_VERSION: str = "0.0.0"
    PROJECT_DESCRIPTION: str = "A messenger with powerful encryption."
    
<<<<<<< HEAD
    model_config = SettingsConfigDict( # в версии pydantic v3 будет удалена поддержка конфига на основе класса (aka class Config, поэтому заменил на обновленный SettingsConfigDict
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8"
=======
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_encoding="utf-8",
>>>>>>> e820f28 (fix: /ws, /messages, config.py)
    )

settings = Settings()