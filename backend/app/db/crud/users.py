from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import User

# NOTE: ALL DOCSTRING WERE WRITTEN USING ARTIFICIAL INTELLIGENCE, THERE CAN BE SOME MINOR MISTAKES

async def create_user(session: AsyncSession, user_data: dict) -> User:
    """
    Создает нового пользователя в базе данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_data (dict): Словарь с данными пользователя (должен содержать поля, соответствующие модели User).

    Returns:
        User: Созданный объект пользователя со статусом 'pending' (еще не сохранен в БД).

    Note:
        Функция не выполняет автоматический commit. Вызывающий код должен самостоятельно выполнить session.commit().
        Объект пользователя до commit'а находится в состоянии 'pending'.
    """

    user = User(**user_data)
    session.add(user)
    return user # объект имеет статус 'pending'

async def create_multiple_users(session: AsyncSession, users_data: list[dict]) -> list[User]:
    """
    Создает нескольких пользователей в базе данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        users_data (list[dict]): Список словарей с данными пользователей.

    Returns:
        User: Список созданных объектов пользователей (каждый в статусе 'pending').

    Note:
        Функция не выполняет автоматический commit. Все пользователи будут добавлены одной операцией add_all(),
        но для сохранения в БД требуется отдельный вызов session.commit().
    """

    users = [User(**data) for data in users_data]
    session.add_all(users)
    return users

async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    """
    Получает пользователя по его уникальному идентификатору

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_id (int): Уникальный идентификатор пользователя (первичный ключ).

    Returns:
        User: Объект пользователя, если найден, иначе None.

    Note:
        Используется метод session.get(), который напрямую обращается к первичному ключу.
    """

    return await session.get(User, user_id)

async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    """
    Получает пользователя по его имени пользователя (username)

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        username (str): Имя пользователя (username).

    Returns:
        Union[User, None]: Объект пользователя, если найден, иначе None.

    Note:
        Поскольку username должен быть уникальным, возвращается один пользователь или None.
    """

    stmt = select(User).where(User.username == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

async def get_all_users(session: AsyncSession) -> list[User]:
    """
    Получает список всех пользователей из базы данных

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.

    Returns:
        List[User]: Список всех пользователей. Если пользователей нет, возвращает пустой список.
    """

    stmt = select(User)
    result = await session.execute(stmt)
    users = result.scalars().all()
    return list(users)

async def delete_user(session: AsyncSession, user_id: int) -> None: # Каскадное удаление
    """
    Удаляет пользователя по его идентификатору с каскадным удалением связанных записей

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_id (int): Уникальный идентификатор пользователя, которого нужно удалить.

    Returns:
        None

    Note:
        Функция автоматически выполняет commit после удаления.
        Удаление каскадное - все связанные записи (сессии, челленджи, сообщения и т.д.)
        будут удалены автоматически благодаря настройкам внешних ключей в модели User.
        Если пользователь с указанным ID не найден, ничего не происходит.
    """

    user = await session.get(User, user_id)
    if user:
        await session.delete(user)

async def update_user_keys(session: AsyncSession, user_id: int, **kwargs) -> User | None:
    """
    Обновляет криптографические ключи пользователя (или другие поля)

    Args:
        session (AsyncSession): Асинхронная сессия SQLAlchemy для работы с БД.
        user_id (int): Уникальный идентификатор пользователя.
        **kwargs: Произвольные именованные аргументы для обновления полей пользователя.
                  Например: sign_public_key=b'...', dh_public_key=b'...'

    Returns:
        User: Обновленный объект пользователя, если пользователь найден, иначе None.

    Note:
        Функция автоматически выполняет commit после обновления и refresh для получения актуальных данных.
        Если пользователь с указанным ID не найден, возвращает None.
    """
    
    user = await session.get(User, user_id)
    if user:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await session.commit()
        await session.refresh(user)
    return user