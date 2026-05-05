from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v0.router import v0router
from app.config import settings
from app.db.init_db import init_db
from app.api.v0.endpoints.ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.PROJECT_DESCRIPTION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
#localhost:5173 — дефолтный порт Vite, 3000 — Next.js
#в будущем нужно будет для фронта
#НЕ ЗАБЫТЬ ВЫНЕСТИ В КОНФИГ !!!


app.include_router(v0router, prefix=settings.API_PREFIX)
app.include_router(ws_router, prefix=settings.API_PREFIX)