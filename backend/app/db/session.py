from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from typing import AsyncGenerator

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
_is_in_memory_sqlite = settings.DATABASE_URL.endswith(":memory:")

_connect_args = {"check_same_thread": False} if _is_sqlite else {}
_pool_kwargs = {"poolclass": StaticPool} if _is_in_memory_sqlite else {}

engine = create_async_engine(
    url=settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
    **_pool_kwargs,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
    autocommit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
