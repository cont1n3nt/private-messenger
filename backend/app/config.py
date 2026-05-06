from pydantic_settings import BaseSettings
from pathlib import Path
from sqlalchemy.engine import URL

BASE_DIR = Path(__file__).parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    DATABASE_URL = "sqlite+aiosqlite:///private_messenger.db"
    TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

    API_PREFIX: str = "/api/v0"
    PROJECT_NAME: str = "Private Messenger"
    PROJECT_VERSION: str = "0.0.0"
    PROJECT_DESCRIPTION: str = "A messenger with powerful encryption."
    
    class Config:
        env_file = str(ENV_FILE)
        env_encoding = "utf-8"

settings = Settings()