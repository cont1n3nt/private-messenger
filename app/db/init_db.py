import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, pool_size=20, max_overflow=10, pool_pre_ping=True)
# можно добавить параметр echo=True для логгирования всех sql запросов в консоль
# pool_size=20 - макс кол-во соединений с БД, которые будут храниться
# max_overflow=10 - кол-во доп. соединений сверх pool_size в момент пиковой нагрузки
# pool_pre_ping=True - перед использованием пула проверяет, жив ли он

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=True, autocommit=False)
# bind - чисто привязка, чтобы фабрика знала, куда запросы отправлять
# class_ - это тип сессии; для асинхронной фабрики сессий обязательно указать!
# expire_on_commit=False - после коммита алхимия не помечает все загруженные объекты как просрочку, а хранит в кэше
# autoflush=True - объекты, меняющиеся в сессии накапливаются, а алхимия вносит в БД перед чтением
# autocommit=False - ничего не сохранится в БД, пока не сказать, никогда не менять!