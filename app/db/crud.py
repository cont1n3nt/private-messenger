from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import User, Message, Session, Challenge
from typing import List, Union
import datetime

async def create_user(session: AsyncSession, user_data: dict) -> User:
    user = User(**user_data)
    session.add(user)
    return user # объект имеет статус 'pending'

async def create_multiple_users(session: AsyncSession, users_data: list[dict]) -> User:
    users = [User(**data) for data in users_data]
    session.add_all(users)
    return users

async def get_user_by_id(session: AsyncSession, user_id: int) -> User:
    return await session.get(User, user_id)

async def get_user_by_username(session: AsyncSession, username: str) -> Union[User, None]:
    stmt = select(User).where(User.username == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_all_users(session: AsyncSession) -> List[User]:
    stmt = select(User)
    result = await session.execute(stmt)
    users = result.scalars().all()
    return users

async def delete_user(session: AsyncSession, user_id: int) -> None: # Каскадное удаление
    user = await session.get(User, user_id)
    if user:
        await session.delete(user)
        await session.commit()

async def update_user_keys(session: AsyncSession, user_id: int, **kwargs) -> User:
    user = await session.get(User, user_id)
    if user:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await session.commit()
        await session.refresh(user)
    return user

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
    stmt = delete(Session).where(Session.expires_at < datetime.datetime.utcnow())
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def delete_all_sessions(session: AsyncSession) -> int:
    stmt = delete(Session)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def create_message(session: AsyncSession, message_data: dict) -> Message:
    message = Message(**message_data)
    session.add(message)
    return message

async def get_messages(session: AsyncSession) -> List[Message]:
    stmt = select(Message)
    result = await session.execute(stmt)
    messages = result.scalars().all()
    return messages

async def get_latest_messages(session: AsyncSession, limit: int) -> List[Message]:
    stmt = select(Message).order_by(Message.id.asc()).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_messages_after(session: AsyncSession, message_id: int) -> List[Message]:
    stmt = select(Message).where(Message.id > message_id)
    result = await session.execute(stmt)
    messages = result.scalars().all()
    return messages

async def delete_old_messages(session: AsyncSession) -> int:
    stmt = delete(Message).where(Message.delete_at < datetime.datetime.utcnow())
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def create_challenge(session: AsyncSession, challenge_data: dict) -> Challenge:
    stmt = delete(Challenge).where(Challenge.user_id == challenge_data["user_id"])
    await session.execute(stmt)
    await session.commit() # не устареет сессия, т.к. expired_on_commit=False
    challenge = Challenge(**challenge_data)
    session.add(challenge)
    return challenge

async def get_active_challenge(session: AsyncSession, user_id: int) -> Union[Challenge, None]:
    stmt = select(Challenge).where(Challenge.expires_at >= datetime.datetime.now() and Challenge.used == 0 and Challenge.user_id == user_id)
    result = await session.execute(stmt)
    challenge = result.scalar_one_or_none()
    return challenge

async def delete_challenge(session: AsyncSession, user_id: int) -> None:
    stmt = delete(Challenge).where(Challenge.user_id == user_id)
    await session.execute(stmt)
    await session.commit()

async def delete_expired_challenges(session: AsyncSession) -> int:
    stmt = delete(Challenge).where(Challenge.expires_at < datetime.datetime.utcnow() or Challenge.used == 1)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount