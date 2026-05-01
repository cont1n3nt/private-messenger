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
<summary><b>📁 app/</b> — основной код приложения</summary>
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