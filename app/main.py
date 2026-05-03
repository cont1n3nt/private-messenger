from fastapi import FastAPI
from app.api.v0.router import v0router
from app.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.PROJECT_DESCRIPTION,
)

app.include_router(v0router, prefix=settings.API_PREFIX)