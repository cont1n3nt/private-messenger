from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str

    API_PREFIX: str = "/api/v0"
    PROJECT_NAME: str = "Private Messenger"
    PROJECT_VERSION: str = "0.0.0"
    PROJECT_DESCRIPTION: str = "A messenger with powerful encryption."
    
    class Config:
        env = ".env"
        env_encoding = "utf-8"

settings = Settings()