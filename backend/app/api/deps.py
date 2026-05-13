from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import AsyncGenerator

from app.api.security import _AUTH_FAILED, extract_bearer_token
from app.db.session import get_session
from app.db.models import User
from app.db import crud

async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncGenerator[AsyncSession, None]:
    yield session


async def get_current_user(
    token: str = Depends(extract_bearer_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    db_session = await crud.get_session_by_token(db, token)
    
    if db_session is None:
        raise _AUTH_FAILED
    
    expires_at = db_session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        await crud.delete_session(db, token)
        await db.commit()
        raise _AUTH_FAILED
        
    return db_session.user
