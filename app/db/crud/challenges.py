from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from app.db.models import Challenge
from typing import Union
import datetime

async def create_challenge(session: AsyncSession, challenge_data: dict) -> Challenge:
    stmt = delete(Challenge).where(Challenge.user_id == challenge_data["user_id"])
    await session.execute(stmt)
    await session.commit() # не устареет сессия, т.к. expired_on_commit=False
    challenge = Challenge(**challenge_data)
    session.add(challenge)
    return challenge

async def get_active_challenge(session: AsyncSession, user_id: int) -> Union[Challenge, None]:
    stmt = select(Challenge).where(and_(Challenge.expires_at >= datetime.datetime.now(datetime.UTC), Challenge.used == 0, Challenge.user_id == user_id))
    result = await session.execute(stmt)
    challenge = result.scalar_one_or_none()
    return challenge

async def delete_challenge(session: AsyncSession, user_id: int) -> None:
    stmt = delete(Challenge).where(Challenge.user_id == user_id)
    await session.execute(stmt)
    await session.commit()

async def delete_expired_challenges(session: AsyncSession) -> int:
    stmt = delete(Challenge).where(or_(Challenge.expires_at < datetime.datetime.now(datetime.UTC), Challenge.used == 1))
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount