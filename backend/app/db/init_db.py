import asyncio
from .session import engine
from .models import Base


async def init_db():
    # Создает все таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def drop_db():
    # Удаляет все таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

async def reset_db():
    # Сброс БД (т.е очистка и повторное создание)
    await drop_db()
    await init_db()

async def dispose_engine():
    # Закрытие соединения с БД
    await engine.dispose()