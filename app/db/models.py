from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, LargeBinary, DateTime, ForeignKey, Integer
from datetime import datetime
from typing import List

# ORM-модель:
# Атрибуты класса - столбцы таблицы
# Экземпляры класса - строки таблицы
# Имя класса - имя таблицы (по умолчанию)

class Base(DeclarativeBase):
    # Позволяет определять структуру БД через объявление класса
    pass

class User(Base):
    """
    Базовый класс пользователя

    Attributes:
        id (int): Уникальный идентификатор пользователя.
        username (str): Юзернейм пользователя.
        sign_public_key (bytes): Публичный ключ подписи.
        dh_public_key (bytes): Публичный ключ Диффи-Хеллмана.
    """

    __tablename__ = "users"
    
    # Mapped - это контейнер для типа
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True) # Автозаполнение, первичный ключ
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False) # Строка длиной не более 64 символов, является уникальной, не может быть пустой (NULL)
    sign_public_key: Mapped[bytes] = mapped_column(LargeBinary, unique=True, nullable=False)
    dh_public_key: Mapped[bytes] = mapped_column(LargeBinary, unique=True, nullable=False)

    sessions: Mapped[List["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="select") # При удалении пользователя удаляется закрепленная за ним сессия
    sent_messages: Mapped[List["Message"]] = relationship(back_populates="sender", foreign_keys="Message.sender_id", lazy="select")

class Session(Base):
    """
    Базовый класс сессии

    Attributes:
        token (str): Токен сессии.
        user_id (int): Уникальный идентификатор пользователя, за которым закреплена сессия.
        expires_at (datetime): Дата и время, когда сессия станет недействительной.
    """

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(255), primary_key=True, unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) # внешний ключ, связь с конкретным пользователем
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    user: Mapped["User"] = relationship(back_populates="sessions", lazy="joined")

class Message(Base):
    """
    Базовый класс сообщения

    Attributes:
        id (int): Уникальный идентификатор сообщения.
        sender_id (int): Уникальный идентификатор отправителя сообщения.
        ciphertext (bytes): Зашифрованный текст.
        nonce (int): Число, использованное единожды (number used once).
        created_at (datetime): Дата и время отправки сообщения.
    """

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)

    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id], lazy="selectin")