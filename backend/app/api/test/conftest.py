"""
РћР±С‰РёР№ conftest РґР»СЏ API-С‚РµСЃС‚РѕРІ.
РџРѕРґРЅРёРјР°РµС‚ FastAPI РїСЂРёР»РѕР¶РµРЅРёРµ СЃ in-memory SQLite,
РїРµСЂРµРѕРїСЂРµРґРµР»СЏРµС‚ get_db Рё get_session Р·Р°РІРёСЃРёРјРѕСЃС‚Рё.
"""

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.db import models
from app.db.session import get_session
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def engine():
    _engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with _engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(engine):
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def client(engine):
    """AsyncClient СЃ РїРµСЂРµРѕРїСЂРµРґРµР»С‘РЅРЅРѕР№ Р·Р°РІРёСЃРёРјРѕСЃС‚СЊСЋ get_session в†’ С‚РµСЃС‚РѕРІР°СЏ Р‘Р”."""
    factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_session():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_user(db_session):
    """РЎРѕР·РґР°С‘С‚ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р±РµР· РїСѓР±Р»РёС‡РЅС‹С… РєР»СЋС‡РµР№."""
    from app.db.crud import create_user

    user = await create_user(db_session, {
        "username": "alice",
    })
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_token(db_session, registered_user):
    """РЎРѕР·РґР°С‘С‚ РІР°Р»РёРґРЅСѓСЋ СЃРµСЃСЃРёСЋ Рё РІРѕР·РІСЂР°С‰Р°РµС‚ С‚РѕРєРµРЅ."""
    import secrets
    from datetime import datetime, timedelta, timezone
    from app.db.crud import create_session

    token = secrets.token_hex(32)
    await create_session(db_session, {
        "user_id": registered_user.id,
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
    })
    await db_session.commit()
    return token


@pytest_asyncio.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
