import asyncio
import logging
from contextlib import asynccontextmanager
from contextlib import suppress
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api.v0.router import v0router
from app.config import settings
from app.db.init_db import init_db, dispose_engine
from app.db.session import AsyncSessionLocal
from app.api.v0.endpoints.ws import router as ws_router
from app.db import crud
from app.api.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)

async def _cleanup_expired():
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await crud.delete_expired_challenges(db)
                await crud.delete_expired_sessions(db)
                await crud.delete_old_messages(db)
        except Exception:
            logger.warning("Cleanup expired records failed", exc_info=True)
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    cleanup_task = asyncio.create_task(_cleanup_expired())
    yield
    cleanup_task.cancel()
    with suppress(asyncio.CancelledError):
        await cleanup_task
    await dispose_engine()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.PROJECT_DESCRIPTION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid request data"})

app.include_router(v0router, prefix=settings.API_PREFIX)
app.include_router(ws_router, prefix=settings.API_PREFIX)
