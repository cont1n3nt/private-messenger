from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models import Message
import datetime

# NOTE: ALL DOCSTRING WERE WRITTEN USING ARTIFICIAL INTELLIGENCE, THERE CAN BE SOME MINOR MISTAKES

async def create_message(session: AsyncSession, message_data: dict) -> Message:
    """
    Создает новое сообщение в базе данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        message_data (dict): Словарь с данными сообщения (должен содержать поля, соответствующие модели Message).

    Returns:
        Message: Созданный объект сообщения (еще не сохранен в БД, требуется вызов commit).

    Note:
        Функция не выполняет автоматический commit. Вызывающий код должен самостоятельно выполнить session.commit().
    """

    message = Message(**message_data)
    session.add(message)
    return message

async def get_messages(session: AsyncSession) -> list[Message]:
    """
    Получает все сообщения из базы данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        List[Message]: Список всех сообщений, отсортированных по первичному ключу (id).
    """

    stmt = select(Message).order_by(Message.id.asc())
    result = await session.execute(stmt)
    messages = result.scalars().all()
    return list(messages)

async def get_latest_messages(session: AsyncSession, limit: int) -> list[Message]:
    """
    Получает указанное количество последних сообщений

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        limit (int): Максимальное количество сообщений для возврата.

    Returns:
        List[Message]: Список последних сообщений, отсортированных по id
                       в порядке возрастания (хронологический порядок).
    """

    stmt = select(Message).order_by(Message.id.desc()).limit(limit)
    result = await session.execute(stmt)
    messages = list(result.scalars().all())
    messages.reverse()
    return messages

async def get_messages_after(session: AsyncSession, message_id: int, limit: int = 1000) -> list[Message]:
    """
    Получает все сообщения, созданные после указанного идентификатора сообщения

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        message_id (int): Идентификатор сообщения, после которого нужно получить все сообщения.

    Returns:
        List[Message]: Список сообщений с id больше указанного, отсортированных по id.

    Note:
        Предполагается, что id являются монотонно возрастающими,
        поэтому условие "id > message_id" эквивалентно "сообщения после".
    """

    stmt = select(Message).where(Message.id > message_id).order_by(Message.id.asc()).limit(limit)
    result = await session.execute(stmt)
    messages = result.scalars().all()
    return list(messages)

async def delete_old_messages(session: AsyncSession) -> int:
    """
    Удаляет все сообщения, у которых время удаления наступило

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        int: Количество удаленных записей (rowcount).

    Criteria:
        Удаляются сообщения, удовлетворяющие условию:
        - delete_at < текущее время UTC

    Note:
        Функция автоматически выполняет commit после удаления.
    """

    stmt = delete(Message).where(Message.delete_at < datetime.datetime.now(datetime.timezone.utc)).execution_options(synchronize_session=False)
    result = await session.execute(stmt)
    await session.commit()
    return int(result.rowcount)

async def get_messages_by_sender(session: AsyncSession, sender_id: int) -> list[Message]:
    """
    Получает все сообщения указанного отправителя

    Args:
        session: Асинхронная сессия SQLAlchemy.
        sender_id: ID отправителя.

    Returns:
        Список сообщений отправителя, отсортированных по id.
    """
    stmt = select(Message).where(Message.sender_id == sender_id).order_by(Message.id.asc())
    result = await session.execute(stmt)
    return list(result.scalars().all())

async def delete_message(session: AsyncSession, message_id: int) -> bool:
    """
    Удаляет сообщение по ID

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        message_id (int): ID удаляемого сообщения.
    
    Returns:
        bool: True если сообщение было удалено, False если не найдено.

    Note:
        Функция автоматически выполняет commit после удаления.
        Функция НЕ проверяет, является ли инициатор удаления отправителем удаляемого сообщения.
    """

    stmt = delete(Message).where(Message.id == message_id)
    result = await session.execute(stmt)
    await session.commit()
    
    return bool(result.rowcount > 0)

async def update_message_content(session: AsyncSession, message_id: int, ciphertext: bytes) -> Message | None:
    """
    Обновляет содержимое сообщения

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        message_id (int): ID сообщения для изменения.
        ciphertext (bytes): Новый зашифрованный текст.
    
    Returns:
        Обновленный объект Message, либо None, если искомое сообщение не найдено.

    Note:
        Функция автоматически выполняет commit после изменения.
        Функция НЕ проверяет, является ли инициатор изменения отправителем изменяемого сообщения.
    """

    message = await session.get(Message, message_id)
    if message:
        setattr(message, "ciphertext", ciphertext)
        setattr(message, "edited_content", True)
        await session.commit()
        await session.refresh(message)
    return message