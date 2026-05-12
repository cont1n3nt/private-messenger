# Changelog

## [0.1.0] - 2026-05-12

Private Messenger — первый стабильный публичный релиз. Полноценный end-to-end шифрованный групповой чат с веб-интерфейсом, поддержкой реального времени, редактированием/удалением/ответами на сообщения и Markdown-разметкой.

### Архитектура
- **Backend**: FastAPI (Python) с SQLAlchemy + aiosqlite (SQLite), Pydantic v2, slowapi (ratelimit), uvicorn
- **Frontend**: React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + Framer Motion 12
- **Криптография**: `@noble/ciphers` + `@noble/curves` (клиент), `cryptography` 47.x (сервер)

### API Endpoints (`/api/v0`)
- **`POST /auth/challenge`** — запрос challenge (5/min); всегда 200 для любого username (защита от перебора)
- **`POST /auth/verify`** — верификация Ed25519-подписи, выдача session token (24h TTL) (10/min)
- **`POST /auth/logout`** — инвалидация сессии
- **`GET /auth/me`** — информация о текущем пользователе `{id, username}`
- **`GET /users`** — список всех пользователей с публичными ключами
- **`POST /keys/init`** — загрузка Ed25519 + X25519 публичных ключей (base64, 32 байта); идемпотентность, запрет смены ключей (409)
- **`GET /keys`** — список пользователей с ключами
- **`GET /messages`** — получение сообщений (пагинация `?limit=N&after_id=N`, дефолт 100)
- **`POST /messages`** — отправка зашифрованного сообщения (30/min); авто-удаление через 48ч
- **`GET /messages/me`** — сообщения текущего пользователя
- **`POST /messages/edit`** — редактирование своего сообщения (30/min)
- **`POST /messages/delete`** — удаление своего сообщения
- **`WS /api/v0/ws`** — WebSocket real-time: broadcast `new_message`, `edit_message`, `delete_message`, heartbeat `ping/pong`

### Модели данных (SQLAlchemy)
- **User** — id, username (unique), sign_public_key, dh_public_key
- **Session** — token (PK), user_id (FK), expires_at
- **Message** — id, sender_id (FK), ciphertext (bytes), nonce (bytes), reply_to_message, edited_content, created_at, delete_at (48h TTL)
- **Challenge** — user_id (FK), challenge (PK, hex64), expires_at, used

### Криптографическая система
- **Аутентификация**: Ed25519 challenge-response (сервер генерирует 32 байта random, клиент подписывает)
- **Key Exchange**: X25519 ECDH + HKDF-SHA256 для каждой пары пользователей
- **Group Key**: случайный 32-байтовый ключ, распределяется основателем (min userId) через ECDH-зашифрованные `key_setup` сообщения
- **Encryption**: XChaCha20-Poly1305 AEAD (24-byte nonce)
- **Хранение ключей**: IndexedDB в браузере, приватные ключи seed-пользователей в `backend/keys/*.json`

### Frontend (React SPA)
- **Страницы**: LoginPage (ввод username, импорт JSON ключей, сброс ключей), ChatPage (интерфейс чата)
- **Компоненты чата**: ChatScreen, ChatMessages, MessageBubble (Markdown через react-markdown + remark-gfm), MessageContextMenu (Reply/Copy/Edit/Delete), ReplyPreview, DateSeparator, WaitingIndicator, FloatingHeader
- **Компоненты ввода**: MessageInput (compose/reply/edit modes), SendButton
- **UI-кит**: NeonButton, IconButton, GlassPanel, Badge, Avatar, InputField, CheckMark
- **Анимации**: Framer Motion (сообщения, orb, появление), плавные переходы, поддержка `prefers-reduced-motion`
- **Тема**: тёмная стеклянная (glassmorphism) с шумовой текстурой, неоновым паттерном и плавающими орбами
- **Wallpaper**: WallpaperLayer, FloatingOrb, NoiseTexture, NeonPattern, GradientOverlay
- **Управление состоянием**: React Context (AuthContext + ChatContext)
- **WebSocket-клиент**: автоматическое подключение после установки group key, exponential backoff reconnection (3-30s), дозагрузка пропущенных сообщений через REST
- **Оптимистичные обновления**: edit/delete применяются локально сразу, откат при ошибке API

### Криптомодули (клиентские, `src/crypto/`)
- `auth.ts` — Ed25519 `signChallenge()`
- `keys.ts` — IndexedDB storage: `saveKeyPair()`, `loadKeyPair()`, `deleteKeyPair()`, `importKeysFromJson()`
- `cipher.ts` — XChaCha20-Poly1305: `encrypt()`, `decrypt()`
- `ecdh.ts` — X25519 ECDH + HKDF: `computePairwiseSecrets()`

### Безопасность
- Атомарное потребление challenge (`UPDATE ... SET used=1 WHERE used=0`) — защита от TOCTOU/replay
- Единая ошибка аутентификации (401) для всех типов сбоев
- `/auth/challenge` всегда возвращает 200 — защита от перебора username
- Запрет смены публичных ключей после установки (409 Conflict)
- CORS ограничен `localhost:5173` и `localhost:3000`
- Rate limiting: challenge (5/min), verify (10/min), send (30/min), edit (30/min)
- Авто-удаление сообщений через 48 часов, фоновая очистка просроченных сессий/челленджей каждые 60 мин
- Шифрование группы: перераспределение group key новым пользователям основателем (периодический polling)

### База данных
- **SQLite** через aiosqlite (async), SQLAlchemy 2.0 ORM
- Фоновая задача `_cleanup_expired()` (lifespan): удаление expired challenges, sessions, messages
- `seed.py` — создание демо-пользователей (kosmo, ayala13rus, treizd) с генерацией Ed25519 + X25519 ключей

### Тестирование
- **API тесты** (pytest + httpx.AsyncClient, in-memory SQLite):
  - `test_auth.py` — 14 тестов: challenge, verify, logout, me
  - `test_users.py` — 6 тестов: list users, auth checks
  - `test_keys.py` — 9 тестов: init keys, idempotency, conflict, validation
- **CRUD тесты** (pytest-asyncio, in-memory SQLite):
  - `test_users.py` — 11 тестов: CRUD + update keys
  - `test_sessions.py` — 9 тестов: CRUD + expired cleanup
  - `test_challenges.py` — 10 тестов: CRUD + atomic use + expired cleanup
  - `test_messages.py` — 10 тестов: CRUD + after_id + old deletion
- Всего ~60 тестовых сценариев

### Разработка и деплой
- **Backend**: `uvicorn app.main:app --reload`
- **Frontend**: `npm run dev` (Vite, прокси `/api` → `http://localhost:8000`)
- **Линтер**: ESLint с @typescript-eslint (React hooks, Refresh)
- **Типизация**: TypeScript strict (noUnusedLocals, noUnusedParameters), Python mypy (`mypy.ini`)
- **Dockerfile**: присутствует (в разработке)
- **Зависимости**: Python (FastAPI 0.136.1, SQLAlchemy 2.0.49, cryptography 47.0.0), JS/TS (React 19, noble ciphers 2.2, noble curves 2.2, Tailwind 4.2, Framer Motion 12.38, Axios 1.16)

---

## [0.0.0] — 2026-05-01 – 2026-05-06

*Начальная разработка. Создание базовой структуры, ORM-моделей, CRUD-операций, системы аутентификации и тестов.*

### Added
- CHANGELOG.md, requirements.txt, .gitignore
- Структура проекта: бэкенд на FastAPI, монолитная архитектура
- SQLAlchemy ORM модели (User, Message, Session, Challenge) с docstrings
- Pydantic схемы (auth, users, keys, messages, base APIResponse)
- CRUD методы для всех моделей (users, sessions, challenges, messages)
- Аутентификация: challenge-response на Ed25519, session token (24h TTL)
- API endpoints: `/auth/*`, `/users`, `/keys/*`, `/messages/*`
- WebSocket endpoint `/ws` с ConnectionManager и broadcast
- Rate limiting (slowapi) на критичные endpoint'ы
- Dependency injection (`deps.py`: get_db, get_current_user)
- Pytest тесты: API (~30 тестов) + CRUD (~40 тестов)
- `seed.py` для создания демо-пользователей
- CORS middleware
- Фоновая очистка устаревших данных

### Changed
- Реструктуризация проекта в монорепо (backend/frontend)
- Замена типов nonce с int на bytes в моделях
- Исправление всех datetime-проблем (timezone-aware UTC)
- Namespaced импорты моделей (`app.db.models`)

### Fixed
- `get_active_challenge()` — проверка `used=False`
- Race condition в `use_challenge()` — атомарный UPDATE
- Обработка ошибок аутентификации (единый 401)