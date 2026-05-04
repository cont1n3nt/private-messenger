from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from app.db.models import Challenge
from typing import Union
import datetime

# NOTE: ALL DOCSTRING WERE WRITTEN USING ARTIFICIAL INTELLIGENCE, THERE CAN BE SOME MINOR MISTAKES

async def create_challenge(session: AsyncSession, challenge_data: dict) -> Challenge:
    """
    Создает новый челлендж для пользователя, предварительно удаляя все существующие челленджи этого пользователя

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        challenge_data (dict): Словарь с данными челленджа, обязательно должен содержать ключ "user_id".

    Returns:
        Challenge: Созданный объект челленджа (еще не сохранен в БД, требуется вызов commit).

    Note:
        Функция выполняет commit после удаления старых челленджей, но НЕ выполняет commit после добавления нового.
        Вызывающий код должен самостоятельно выполнить session.commit() для сохранения challenge.
    """

    stmt = delete(Challenge).where(Challenge.user_id == challenge_data["user_id"])
    await session.execute(stmt)
    await session.commit() # не устареет сессия, т.к. expired_on_commit=False
    challenge = Challenge(**challenge_data)
    session.add(challenge)
    return challenge

async def get_active_challenge(session: AsyncSession, user_id: int) -> Union[Challenge, None]:
    """
    Получает активный (неиспользованный и неистекший) челлендж для указанного пользователя

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_id (int): Идентификатор пользователя, чей челлендж нужно получить.

    Returns:
        Union[Challenge, None]: Объект Challenge, если найден активный челлендж, иначе None.

    Criteria:
        Челлендж считается активным, если:
        - expires_at >= текущее время UTC
        - used == 0
        - user_id соответствует указанному
    """

    stmt = select(Challenge).where(and_(Challenge.expires_at >= datetime.datetime.now(datetime.UTC), Challenge.used == 0, Challenge.user_id == user_id))
    result = await session.execute(stmt)
    challenge = result.scalar_one_or_none()
    return challenge

async def delete_challenge(session: AsyncSession, user_id: int) -> None:
    """
    Удаляет все челленджи указанного пользователя

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_id (int): Идентификатор пользователя, чьи челленджи нужно удалить.

    Returns:
        None

    Note:
        Функция автоматически выполняет commit после удаления.
    """

    stmt = delete(Challenge).where(Challenge.user_id == user_id)
    await session.execute(stmt)
    await session.commit()

async def delete_expired_challenges(session: AsyncSession) -> int:
    """
    Удаляет все истекшие и использованные челленджи из базы данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        int: Количество удаленных записей (rowcount).

    Criteria:
        Удаляются челленджи, удовлетворяющие хотя бы одному условию:
        - expires_at < текущее время UTC (истекшие)
        - used == 1 (использованные)

    Note:
        Функция автоматически выполняет commit после удаления.
    """

    stmt = delete(Challenge).where(or_(Challenge.expires_at < datetime.datetime.now(datetime.UTC), Challenge.used == 1))
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount