from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, or_, and_
from app.db.models import Challenge
from typing import Union
import datetime

# NOTE: ALL DOCSTRING WERE WRITTEN USING ARTIFICIAL INTELLIGENCE, THERE CAN BE SOME MINOR MISTAKES

async def create_challenge(session: AsyncSession, challenge_data: dict) -> Challenge:
    """
    Создает новый челлендж для пользователя, предварительно удаляя все существующие челленджи этого пользователя.
    Не выполняет commit — вызывающий код должен сделать session.commit().

    Args:
        session: Асинхронная сессия SQLAlchemy.
        challenge_data: Словарь с данными челленджа (user_id, challenge, expires_at, used).

    Returns:
        Challenge: Созданный объект челленджа (pending, нужен commit).
    """

    stmt = delete(Challenge).where(Challenge.user_id == challenge_data["user_id"]).execution_options(synchronize_session=False)
    await session.execute(stmt)
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

    stmt = select(Challenge).where(and_(Challenge.expires_at >= datetime.datetime.now(datetime.timezone.utc), Challenge.used == 0, Challenge.user_id == user_id)).execution_options(synchronize_session=False)
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

    stmt = delete(Challenge).where(or_(Challenge.expires_at < datetime.datetime.now(datetime.timezone.utc), Challenge.used == 1)).execution_options(synchronize_session=False)
    result  = await session.execute(stmt)
    await session.commit()
    return int(result.rowcount)

async def use_challenge(session: AsyncSession, challenge_hex: str, user_id: int) -> bool:
    """
    Атомарно помечает челлендж как использованный.
    UPDATE ... WHERE used=0 AND challenge=? AND user_id=? AND not expired.
    Возвращает True если ровно одна строка была обновлена (challenge валидный и не использованный).

    Args:
        session: Асинхронная сессия SQLAlchemy.
        challenge_hex: Hex-строка челленджа.
        user_id: ID пользователя.

    Returns:
        True если challenge был успешно помечен как использованный, False иначе.
    """
    stmt = (
        update(Challenge)
        .where(
            and_(
                Challenge.challenge == challenge_hex,
                Challenge.user_id == user_id,
                Challenge.used == 0,
                Challenge.expires_at >= datetime.datetime.now(datetime.timezone.utc),
            )
        )
        .values(used=1)
        .execution_options(synchronize_session=False)
    )
    result = await session.execute(stmt)
    return result.rowcount == 1