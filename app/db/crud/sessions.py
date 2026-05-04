from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.db.models import Session
import datetime

async def create_session(session: AsyncSession, session_data: dict) -> Session:
    session_ = Session(**session_data)
    session.add(session_)
    return session_

async def get_session_by_token(session: AsyncSession, token: str) -> Session:
    return await session.get(Session, token)

async def delete_session(session: AsyncSession, token: str) -> None:
    session_ = await session.get(Session, token)
    if session_:
        await session.delete(session_)
        await session.commit()

async def delete_expired_sessions(session: AsyncSession) -> int:
    stmt = delete(Session).where(Session.expires_at < datetime.datetime.now(datetime.UTC))
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def delete_all_sessions(session: AsyncSession) -> int:
    stmt = delete(Session)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount