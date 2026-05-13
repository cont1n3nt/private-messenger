from .session import engine
from .models import Base


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def reset_db():
    await drop_db()
    await init_db()


async def dispose_engine():
    await engine.dispose()
