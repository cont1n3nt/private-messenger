from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.db.models import Session
import datetime

# NOTE: ALL DOCSTRING WERE WRITTEN USING ARTIFICIAL INTELLIGENCE, THERE CAN BE SOME MINOR MISTAKES

async def create_session(session: AsyncSession, session_data: dict) -> Session:
    """
    Создает новую сессию пользователя

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        session_data (dict): Словарь с данными сессии (должен содержать поля, соответствующие модели Session).

    Returns:
        Session: Созданный объект сессии (еще не сохранен в БД, требуется вызов commit).

    Note:
        Функция не выполняет автоматический commit. Вызывающий код должен самостоятельно выполнить session.commit().
    """

    session_ = Session(**session_data)
    session.add(session_)
    return session_

async def get_session_by_token(session: AsyncSession, token: str) -> Session:
    """
    Получает сессию по токену (первичному ключу)

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        token (str): Уникальный токен сессии (первичный ключ модели Session).

    Returns:
        Session: Объект сессии, если найден, иначе None.

    Note:
        Используется метод session.get(), который работает с первичным ключом напрямую.
        Токен предположительно является первичным ключом модели Session.
    """

    return await session.get(Session, token)

async def delete_session(session: AsyncSession, token: str) -> None:
    """
    Удаляет конкретную сессию по токену

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        token (str): Токен сессии, которую нужно удалить.

    Returns:
        None

    Note:
        Функция автоматически выполняет commit после удаления.
        Если сессия с указанным токеном не найдена, ничего не происходит.
    """

    session_ = await session.get(Session, token)
    if session_:
        await session.delete(session_)
        await session.commit()

async def delete_expired_sessions(session: AsyncSession) -> int:
    """
    Удаляет все истекшие сессии из базы данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        int: Количество удаленных записей (rowcount).

    Criteria:
        Удаляются сессии, удовлетворяющие условию:
        - expires_at < текущее время UTC

    Note:
        Функция автоматически выполняет commit после удаления.
    """

    stmt = delete(Session).where(Session.expires_at < datetime.datetime.now(datetime.timezone.utc)).execution_options(synchronize_session=False)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount

async def delete_all_sessions(session: AsyncSession) -> int:
    """
    Удаляет ВСЕ сессии из базы данных (очищает таблицу)

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        int: Количество удаленных записей (rowcount).

    Warning:
        Эта функция удаляет абсолютно все сессии без возможности восстановления.
        Используйте с осторожностью!

    Note:
        Функция автоматически выполняет commit после удаления.
    """
    
    stmt = delete(Session)
    result = await session.execute(stmt)
    await session.commit()
    return result.rowcount