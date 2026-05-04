from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import Message
from typing import List
import datetime

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
    stmt = delete(Message).where(Message.delete_at < datetime.datetime.now(datetime.UTC))
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount