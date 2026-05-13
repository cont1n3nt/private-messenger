from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, LargeBinary, DateTime, ForeignKey, Integer, Boolean
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class User(Base):
    """
    Р‘Р°Р·РѕРІС‹Р№ РєР»Р°СЃСЃ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ

    Attributes:
        id (int): РЈРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
        username (str): Р®Р·РµСЂРЅРµР№Рј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ.
        sign_public_key (bytes): РџСѓР±Р»РёС‡РЅС‹Р№ РєР»СЋС‡ РїРѕРґРїРёСЃРё.
        dh_public_key (bytes): РџСѓР±Р»РёС‡РЅС‹Р№ РєР»СЋС‡ Р”РёС„С„Рё-РҐРµР»Р»РјР°РЅР°.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    sign_public_key: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    dh_public_key: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="select")
    sent_messages: Mapped[list["Message"]] = relationship(back_populates="sender", foreign_keys="Message.sender_id", lazy="select")
    challenges: Mapped[list["Challenge"]] = relationship(back_populates="user", cascade="all, delete-orphan", lazy="select")


class Session(Base):
    """
    Р‘Р°Р·РѕРІС‹Р№ РєР»Р°СЃСЃ СЃРµСЃСЃРёРё

    Attributes:
        token (str): РўРѕРєРµРЅ СЃРµСЃСЃРёРё.
        user_id (int): РЈРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, Р·Р° РєРѕС‚РѕСЂС‹Рј Р·Р°РєСЂРµРїР»РµРЅР° СЃРµСЃСЃРёСЏ.
        expires_at (datetime): Р”Р°С‚Р° Рё РІСЂРµРјСЏ, РєРѕРіРґР° СЃРµСЃСЃРёСЏ СЃС‚Р°РЅРµС‚ РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅРѕР№.
    """

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship(back_populates="sessions", lazy="joined")


class Message(Base):
    """
    Р‘Р°Р·РѕРІС‹Р№ РєР»Р°СЃСЃ СЃРѕРѕР±С‰РµРЅРёСЏ

    Attributes:
        id (int): РЈРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРѕРѕР±С‰РµРЅРёСЏ.
        sender_id (int): РЈРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РѕС‚РїСЂР°РІРёС‚РµР»СЏ СЃРѕРѕР±С‰РµРЅРёСЏ.
        ciphertext (bytes): Р—Р°С€РёС„СЂРѕРІР°РЅРЅС‹Р№ С‚РµРєСЃС‚.
        nonce (bytes): Nonce РґР»СЏ СЂР°СЃС€РёС„СЂРѕРІРєРё (24 Р±Р°Р№С‚Р°, XChaCha20).
        created_at (datetime): Р”Р°С‚Р° Рё РІСЂРµРјСЏ РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ.
        delete_at (datetime): Р”Р°С‚Р° Рё РІСЂРµРјСЏ СѓРґР°Р»РµРЅРёСЏ СЃРѕРѕР±С‰РµРЅРёСЏ.
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
    Р‘Р°Р·РѕРІС‹Р№ РєР»Р°СЃСЃ С‡РµР»Р»РµРЅРґР¶Р°

    Attributes:
        user_id (int): РЈРЅРёРєР°Р»СЊРЅС‹Р№ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ, Р·Р° РєРѕС‚РѕСЂС‹Рј Р·Р°РєСЂРµРїР»РµРЅ С‡РµР»Р»РµРЅРґР¶.
        challenge (str): РЈРЅРёРєР°Р»СЊРЅР°СЏ, РЅРµРїСЂРµРґСЃРєР°Р·СѓРµРјР°СЏ, РѕРґРЅРѕСЂР°Р·РѕРІР°СЏ С„СЂР°Р·Р°.
        expires_at (datetime): Р”Р°С‚Р° Рё РІСЂРµРјСЏ, РєРѕРіРґР° С‡РµР»Р»РµРЅРґР¶ СЃС‚Р°РЅРµС‚ РЅРµРґРµР№СЃС‚РІРёС‚РµР»СЊРЅС‹Рј.
        used (int): РџРѕРєР°Р·С‹РІР°РµС‚, Р±С‹Р» Р»Рё РёСЃРїРѕР»СЊР·РѕРІР°РЅ СѓР¶Рµ (0 - РЅРµС‚, 1 - РґР°)
    """

    __tablename__ = "challenges"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    challenge: Mapped[str] = mapped_column(String, primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="challenges", lazy="joined")
