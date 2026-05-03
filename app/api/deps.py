from fastapi import Depends, Header, HTTPException, status

from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.session import get_session
from app.db.models import User
from app.db import crud

async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session


async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> User:
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expected 'Authorization: Bearer <token>'",
        )
        
    token: str = authorization.removeprefix("Bearer ").strip()
    db_session = await crud.get_session_by_token(db, token)
    
    if db_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token not found",
        )
    
    if db_session.expires_at < datetime.utcnow():
        await crud.delete_session(db, token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
        
    return db_session.user