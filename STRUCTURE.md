<details>
<summary><b>📁 private-messenger/</b> — корень проекта</summary>
<pre>
requirements.txt
Dockerfile
docker-compose.yml
README.md
.env
</pre>

<details>
<summary><b>📁 app/</b> — основной код приложения (бэкенд)</summary>
<pre>
__init__.py
main.py
config.py
</pre>

<details>
<summary><b>📁 api/</b> — слой маршрутов</summary>
<pre>
__init__.py
deps.py
</pre>

<details>
<summary><b>📁 v1/</b> — API версии 1</summary>
<pre>
__init__.py
router.py
</pre>

<details>
<summary><b>📁 endpoints/</b></summary>
<pre>
users.py
items.py
auth.py
</pre>
</details>
</details>

<details>
<summary><b>📁 v2/</b> — API версии 2</summary>
<pre>
(аналогичная структура)
</pre>
</details>
</details>

<details>
<summary><b>📁 core/</b> — бизнес-логика</summary>
<pre>
__init__.py
security.py
exceptions.py
</pre>
</details>

<details>
<summary><b>📁 crud/</b> — операции с БД</summary>
<pre>
base.py
user.py
item.py
</pre>
</details>

<details>
<summary><b>📁 models/</b> — ORM модели</summary>
<pre>
user.py
item.py
</pre>
</details>

<details>
<summary><b>📁 schemas/</b> — Pydantic схемы</summary>
<pre>
user.py
item.py
token.py
</pre>
</details>

<details>
<summary><b>📁 services/</b> — дополнительные сервисы</summary>
<pre>
s3_storage.py
</pre>
</details>

<details>
<summary><b>📁 db/</b> — работа с БД</summary>
<pre>
session.py
init_db.py
</pre>
</details>
</details>

<details>
<summary><b>📁 frontend/</b> — фронтенд (React/Vue)</summary>
<pre>
package.json
index.html
vite.config.js
.env
</pre>

<details>
<summary><b>📁 src/</b> — исходники фронтенда</summary>
<pre>
main.jsx
App.jsx
</pre>

<details>
<summary><b>📁 components/</b> — React/Vue компоненты</summary>
<pre>
Chat.jsx
Message.jsx
Sidebar.jsx
Login.jsx
Register.jsx
</pre>
</details>

<details>
<summary><b>📁 pages/</b> — страницы</summary>
<pre>
HomePage.jsx
ProfilePage.jsx
SettingsPage.jsx
</pre>
</details>

<details>
<summary><b>📁 hooks/</b> — хуки (React) / composables (Vue)</summary>
<pre>
useAuth.js
useChat.js
</pre>
</details>

<details>
<summary><b>📁 store/</b> — управление состоянием (Redux/Pinia/Vuex)</summary>
<pre>
authSlice.js
chatSlice.js
</pre>
</details>

<details>
<summary><b>📁 api/</b> — запросы к бэкенду</summary>
<pre>
client.js
auth.js
messages.js
</pre>
</details>

<details>
<summary><b>📁 styles/</b> — стили</summary>
<pre>
global.css
theme.css
</pre>
</details>

<details>
<summary><b>📁 assets/</b> — статика</summary>
<pre>
logo.svg
icons/
images/
</pre>
</details>
</details>

<details>
<summary><b>📁 public/</b> — публичные файлы</summary>
<pre>
favicon.ico
robots.txt
</pre>
</details>
</details>

<details>
<summary><b>📁 tests/</b> — тесты (pytest)</summary>
<pre>
conftest.py
</pre>

<details>
<summary><b>📁 test_api/</b></summary>
<pre>
test_users.py
</pre>
</details>

<details>
<summary><b>📁 test_crud/</b></summary>
<pre>
(тесты CRUD операций)
</pre>
</details>
</details>

<details>
<summary><b>📁 migrations/</b> — Alembic миграции</summary>
<pre>
versions/
</pre>
</details>
</details>