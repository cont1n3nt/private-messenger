my_api/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Точка входа (создание приложения)
│   ├── config.py               # Конфигурации (env, настройки)
│   │
│   ├── api/                    # Слой маршрутов
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependency Injection (например, get_db)
│   │   ├── v1/                 # Версионирование API
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── users.py
│   │   │   │   ├── items.py
│   │   │   │   └── auth.py
│   │   │   └── router.py       # Сбор всех роутов v1
│   │   └── v2/                 # Следующая версия
│   │
│   ├── core/                   # Бизнес-логика, домен
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, хеширование
│   │   └── exceptions.py       # Кастомные ошибки
│   │
│   ├── crud/                   # Операции с БД (Create, Read, Update, Delete)
│   │   ├── base.py
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── models/                 # ORM модели (SQLAlchemy, Peewee)
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── schemas/                # Pydantic схемы (валидация, сериализация)
│   │   ├── user.py
│   │   ├── item.py
│   │   └── token.py
│   │
│   ├── services/               # Доп. логика (загрузка файлов)
│   │   └── s3_storage.py
│   │
│   └── db/                     # Работа с БД
│       ├── session.py          # engine, SessionLocal
│       └── init_db.py          # миграции, начальные данные
│
├── tests/                      # Тесты (pytest)
│   ├── conftest.py
│   ├── test_api/
│   │   └── test_users.py
│   └── test_crud/
│
├── migrations/                 # Alembic (миграции БД)
│
├── requirements.txt            # или pyproject.toml / poetry.lock
├── Dockerfile
├── docker-compose.yml
└── README.md