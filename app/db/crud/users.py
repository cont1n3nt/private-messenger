from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import User
from typing import List, Union

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