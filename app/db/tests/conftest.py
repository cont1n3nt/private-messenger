import pytest_asyncio
from app.db import models
from app.db.crud import *
from app.tests.helpers import make_user_data, make_message_data, make_challenge_data
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as s:
        yield s
    
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.drop_all)
    
    await engine.dispose()

@pytest_asyncio.fixture
async def user(session):
    u = await create_user(session, make_user_data())
    await session.commit()
    await session.refresh(u)
    return u

@pytest_asyncio.fixture
async def test_message(session, user):
    msg = await create_message(session, make_message_data(user.id))
    await session.commit()
    await session.refresh(msg)
    return msg

@pytest_asyncio.fixture
async def test_challenge(session, user):
    challenge = await create_challenge(session, make_challenge_data(user.id))
    await session.commit()
    await session.refresh(challenge)
    return challenge