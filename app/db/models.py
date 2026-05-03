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

    Атрибуты:
        :param id: уникальный идентификатор пользователя (ID)
        :type id: :obj:`int`

        :param username: юзернейм пользователя
        :type username: :obj:`str`

        :param sign_public_key: публичный ключ подписи
        :type sign_public_key: :obj:`bytes`

        :param dh_public_key: публичный ключ Диффи-Хеллмана
        :type dh_public_key: :obj:`bytes`
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

    Атрибуты:
        :param token: токен сессии
        :type token: :obj:`str`

        :param user_id: уникальный идентификатор пользователя (ID), за которым закреплена сессия
        :type user_id: :obj:`int`

        :param expires_at: дата и время, когда сессия станет недействительной
        :type expires_at: :obj:`datetime`
    """

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(255), primary_key=True, unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) # внешний ключ, связь с конкретным пользователем
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    user: Mapped["User"] = relationship(back_populates="sessions", lazy="joined")

class Message(Base):
    """
    Базовый класс сообщения

    Атрибуты:
        :param id: уникальный идентификатор сообшения (ID)
        :type id: :obj:`int`

        :param sender_id: уникальный идентификатор отправителя сообщения (ID)
        :type sender_id: :obj:`int`

        :param ciphertext: зашифрованный текст
        :type ciphertext: :obj:`bytes`

        :param nonce: "число, использованные единожды"
        :type nonce: :obj:`int`

        :param created_at: дата и время отправки сообщения
        :type created_at: :obj:`datetime`
    """

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.now)

    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id], lazy="selectin")