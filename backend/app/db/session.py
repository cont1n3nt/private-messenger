from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from typing import AsyncGenerator

_connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
_pool_kwargs = {"poolclass": StaticPool} if "sqlite" in settings.DATABASE_URL else {"pool_size": 20, "max_overflow": 10}

engine = create_async_engine(
    url=settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
    **_pool_kwargs,
)

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=True, autocommit=False)
# bind - чисто привязка, чтобы фабрика знала, куда запросы отправлять
# class_ - это тип сессии; для асинхронной фабрики сессий обязательно указать!
# expire_on_commit=False - после коммита алхимия не помечает все загруженные объекты как просрочку, а хранит в кэше
# autoflush=True - объекты, меняющиеся в сессии накапливаются, а алхимия вносит в БД перед чтением
# autocommit=False - ничего не сохранится в БД, пока не сказать, никогда не менять!

# ORM-модель:
# Атрибуты класса - столбцы таблицы
# Экземпляры класса - строки таблицы
# Имя класса - имя таблицы (по умолчанию)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise