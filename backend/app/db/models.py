from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, LargeBinary, DateTime, ForeignKey, Integer, Boolean
from datetime import datetime, timezone

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
    sign_public_key: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    dh_public_key: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="select")
    sent_messages: Mapped[list["Message"]] = relationship(back_populates="sender", foreign_keys="Message.sender_id", lazy="select")
    challenges: Mapped[list["Challenge"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="select")

class Session(Base):
    """
    Базовый класс сессии

    Attributes:
        token (str): Токен сессии.
        user_id (int): Уникальный идентификатор пользователя, за которым закреплена сессия.
        expires_at (datetime): Дата и время, когда сессия станет недействительной.
    """

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True) # внешний ключ, связь с конкретным пользователем
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship(back_populates="sessions", lazy="joined")

class Message(Base):
    """
    Базовый класс сообщения

    Attributes:
        id (int): Уникальный идентификатор сообщения.
        sender_id (int): Уникальный идентификатор отправителя сообщения.
        ciphertext (bytes): Зашифрованный текст.
        nonce (bytes): Nonce для расшифровки (24 байта, XChaCha20).
        created_at (datetime): Дата и время отправки сообщения.
        delete_at (datetime): Дата и время удаления сообщения.
    """

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    reply_to_message: Mapped[int] = mapped_column(Integer, default=-1)
    edited_content: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    delete_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    sender: Mapped["User"] = relationship(back_populates="sent_messages", foreign_keys=[sender_id], lazy="noload")

class Challenge(Base):
    """
    Базовый класс челленджа
    
    Attributes:
        user_id (int): Уникальный идентификатор пользователя, за которым закреплен челлендж.
        challenge (str): Уникальная, непредсказуемая, одноразовая фраза.
        expires_at (datetime): Дата и время, когда челлендж станет недействительным.
        used (int): Показывает, был ли использован уже (0 - нет, 1 - да)
    """

    __tablename__ = "challenges"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    challenge: Mapped[str] = mapped_column(String, primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="challenges", lazy="joined")